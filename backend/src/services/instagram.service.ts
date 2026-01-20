import { IgApiClient } from 'instagram-private-api';
import { prisma } from '../lib/prisma.js';
import cron from 'node-cron';
import axios from 'axios';
import { InstagramPostType } from '@prisma/client';

/**
 * Serviço para gerenciar integrações com a API Privada do Instagram.
 * Suporta: Posts, Reels, Stories, DM, Follow/Unfollow e Agendamento.
 */
export class InstagramService {
  private static instance: InstagramService;
  private clients: Map<string, IgApiClient> = new Map();

  private constructor() {
    // Workers moved to explicit startWorkers() to avoid early Prisma calls
  }

  public startWorkers() {
    console.log('[InstagramService] Starting Workers...');
    this.initWorkers();
  }

  public static getInstance(): InstagramService {
    if (!InstagramService.instance) {
      InstagramService.instance = new InstagramService();
    }
    return InstagramService.instance;
  }

  /**
   * Inicializa um cliente para uma conta específica, gerenciando a sessão persistente.
   */
  private async getClient(accountId: string): Promise<IgApiClient> {
    if (this.clients.has(accountId)) {
      return this.clients.get(accountId)!;
    }

    const account = await prisma.instagramAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) throw new Error('Conta do Instagram não encontrada no banco de dados.');

    const ig = new IgApiClient();
    ig.state.generateDevice(account.username);

    let sessionValid = false;
    if (account.sessionData && typeof account.sessionData === 'object') {
      try {
        await ig.state.deserialize(account.sessionData as any);
        // Testar a sessão com uma chamada simples
        await ig.account.currentUser();
        console.log(`[InstagramService] Sessão restaurada e VALIDADA para: ${account.username}`);
        sessionValid = true;
      } catch (e) {
        console.warn(`[InstagramService] Sessão salva para ${account.username} é INVÁLIDA ou EXPIRADA. Tentando novo login...`);
      }
    }

    if (!sessionValid) {
      console.log(`[InstagramService] Iniciando novo login para: ${account.username}`);
      await ig.simulate.preLoginFlow();
      const loggedInUser = await ig.account.login(account.username, account.password);
      process.nextTick(async () => await ig.simulate.postLoginFlow());
      
      const serialized = await ig.state.serialize();
      delete (serialized as any).constants; // Segurança
      
      await prisma.instagramAccount.update({
        where: { id: accountId },
        data: { 
          sessionData: serialized as any,
          status: 'CONNECTED'
        }
      });
      console.log(`[InstagramService] Login bem-sucedido para: ${account.username}`);
    }

    this.clients.set(accountId, ig);
    return ig;
  }

  /**
   * Valida as credenciais de uma conta (apenas login).
   */
  async validateAccount(accountId: string) {
    try {
      await this.getClient(accountId);
      return true;
    } catch (error: any) {
      console.error(`[InstagramService] Falha na validação da conta ${accountId}:`, error.message);
      // Se for erro de senha ou desafio (challenge), atualizar status
      await prisma.instagramAccount.update({
        where: { id: accountId },
        data: { status: 'ERROR' }
      });
      throw error;
    }
  }

  /**
   * Faz o upload de mídia (Foto/Vídeo) para Feed, Story ou Reels.
   */
  async uploadMedia(accountId: string, type: InstagramPostType, caption: string, mediaUrls: string[]) {
    const ig = await this.getClient(accountId);
    
    // Pequena simulação de atividade para evitar detecção de bot
    try {
      await ig.simulate.postLoginFlow();
    } catch (e) {
      // Ignorar erros na simulação
    }

    // Download das mídias
    const buffers = await Promise.all(mediaUrls.map(async (url) => {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    }));

    const attemptUpload = async () => {
      try {
        switch (type) {
          case 'POST':
            if (buffers.length === 1) {
              await ig.publish.photo({ file: buffers[0], caption });
            } else {
              await ig.publish.album({
                items: buffers.map(b => ({ file: b })),
                caption
              });
            }
            break;
          case 'STORY':
            await ig.publish.story({ file: buffers[0] });
            break;
          case 'REEL':
            await ig.publish.video({
              video: buffers[0],
              coverImage: buffers[0], // Simplificado: usa o primeiro frame
              caption
            });
            break;
        }
        console.log(`[InstagramService] Mídia do tipo ${type} publicada com sucesso.`);
      } catch (error: any) {
        if (error.message.includes('inactive') || error.message.includes('session')) {
          console.warn(`[InstagramService] Erro de sessão detectado (${error.message}). Limpando cache e tentando novamente...`);
          this.clients.delete(accountId);
          await this.getClient(accountId);
          // Tentar novamente apenas uma vez
          await this.uploadMedia(accountId, type, caption, mediaUrls);
        } else {
          throw error;
        }
      }
    };

    await attemptUpload();
  }

  /**
   * Envia uma mensagem direta (DM).
   */
  async sendDirectMessage(accountId: string, targetUsername: string, text: string) {
    const ig = await this.getClient(accountId);
    const userId = await ig.user.getIdByUsername(targetUsername);
    const thread = ig.entity.directThread([userId.toString()]);
    await thread.broadcastText(text);
    console.log(`[InstagramService] DM enviada para ${targetUsername}`);
  }

  /**
   * Segue ou deixa de seguir um usuário.
   */
  async setRelationship(accountId: string, targetUsername: string, action: 'follow' | 'unfollow') {
    const ig = await this.getClient(accountId);
    const userId = await ig.user.getIdByUsername(targetUsername);
    if (action === 'follow') {
      await ig.friendship.create(userId);
    } else {
      await ig.friendship.destroy(userId);
    }
    console.log(`[InstagramService] Ação ${action} executada para ${targetUsername}`);
  }

  /**
   * Inicializa os trabalhadores de cron para agendamento e automações.
   */
  private initWorkers() {
    // Agendamento de Posts: a cada minuto
    cron.schedule('* * * * *', () => this.processScheduledPosts());
    
    // Automação de Boas-vindas: a cada 15 minutos (para evitar spam/bloqueios)
    cron.schedule('*/15 * * * *', () => this.autoWelcomeNewFollowers());

    // Sincronização de DMs: a cada 1 minuto (Aumentado para feedback rápido)
    cron.schedule('*/1 * * * *', () => this.syncAllDirectMessages());
    
    console.log('[InstagramService] Workers initialized: Posts, Welcome, DM Sync');
  }

  /**
   * Sincroniza DMs de todas as contas conectadas.
   */
  private async syncAllDirectMessages() {
    console.log('[InstagramWorker] Starting DM synchronization...');
    const accounts = await prisma.instagramAccount.findMany({
      where: { status: 'CONNECTED', isActive: true }
    });

    for (const account of accounts) {
      try {
        await this.syncDirectMessages(account.id);
      } catch (error: any) {
        console.error(`[InstagramWorker] Error syncing DMs for ${account.username}:`, error.message);
      }
    }
  }

  private async syncDirectMessages(accountId: string) {
    const ig = await this.getClient(accountId);
    const inbox = ig.feed.directInbox();
    const threads = await inbox.items();

    for (const thread of threads) {
      const threadId = thread.thread_id;
      
      // Get most recent messages from this thread
      // Threads in ig-private-api have 'last_permanent_item' or items
      const messages = thread.items || [];
      
      for (const msg of messages) {
        // Skip if not a text message (for now, simplify)
        if (msg.item_type !== 'text') continue;
        
        const platformId = msg.item_id;
        const text = msg.text;
        const senderId = msg.user_id.toString();
        const isMe = senderId === ig.state.cookieUserId;
        const senderType = isMe ? 'AGENT' : 'USER';
        
        // Find or create contact
        // In Instagram, the "other" person's ID
        const otherUser = thread.users[0]; // Simplified: assumes 1-on-1
        if (!otherUser) continue;

        const contactPlatformId = otherUser.pk.toString();
        const contactUsername = otherUser.username;

        let contact = await prisma.contact.findUnique({
          where: { platform_platformId: { platform: 'INSTAGRAM', platformId: contactPlatformId } }
        });

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              name: otherUser.full_name || contactUsername,
              platform: 'INSTAGRAM',
              platformId: contactPlatformId,
              phone: '' // Instagram doesn't always provide phone
            }
          });
        }

        // Find or create conversation
        // We need to link to an Integration if possible, but Instagram uses InstagramAccount model
        // So we might need to find a generic Instagram integration or just use null
        const integration = await prisma.integration.findFirst({
          where: { type: 'INSTAGRAM_UNOFFICIAL', status: 'CONNECTED' }
        });

        let conversation = await prisma.conversation.findFirst({
          where: {
            contactId: contact.id,
            platform: 'INSTAGRAM',
            status: 'OPEN'
          }
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              contactId: contact.id,
              platform: 'INSTAGRAM',
              status: 'OPEN',
              integrationId: integration?.id
            }
          });
        }

        // Check if message already exists
        const existingMessage = await prisma.message.findFirst({
           where: {
             conversationId: conversation.id,
             text: text,
             createdAt: { gte: new Date(msg.timestamp / 1000 - 1000), lte: new Date(msg.timestamp / 1000 + 1000) }
           }
        });

        if (!existingMessage) {
          const savedMessage = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              text: text,
              sender: senderType,
              createdAt: new Date(msg.timestamp / 1000)
            }
          });

          // Broadcast to UI
          const { connectionManager } = await import('../websocket/connectionManager.js');
          connectionManager.broadcast({
            type: 'new_message',
            message: savedMessage,
            conversationId: conversation.id,
            integrationId: conversation.integrationId
          });
          
          console.log(`[InstagramWorker] Synced new message from ${contactUsername}: ${text.substring(0, 20)}`);
        }
      }
    }
  }

  private async processScheduledPosts() {
    const now = new Date();
    const pendingPosts = await prisma.instagramPost.findMany({
      where: {
        scheduledAt: { lte: now },
        status: 'SCHEDULED'
      },
      include: { instagramAccount: true }
    });

    if (pendingPosts.length === 0) return;

    console.log(`[InstagramWorker] Processando ${pendingPosts.length} posts agendados...`);

    for (const post of pendingPosts) {
      try {
        await prisma.instagramPost.update({ where: { id: post.id }, data: { status: 'SENDING' } });
        await this.uploadMedia(post.instagramAccountId, post.type, post.caption || '', post.mediaUrls);
        await prisma.instagramPost.update({ where: { id: post.id }, data: { status: 'COMPLETED', publishedAt: new Date() } });
      } catch (error: any) {
        await prisma.instagramPost.update({ where: { id: post.id }, data: { status: 'FAILED', error: error.message } });
      }
    }
  }

  private async autoWelcomeNewFollowers() {
    console.log('[InstagramWorker] Verificando novos seguidores para boas-vindas...');
    
    const accounts = await prisma.instagramAccount.findMany({
      where: { status: 'CONNECTED', isActive: true }
    });

    for (const account of accounts) {
      try {
        const ig = await this.getClient(account.id);
        const followersFeed = ig.feed.accountFollowers(ig.state.cookieUserId);
        const items = await followersFeed.items();

        for (const follower of items) {
          // Verificar se já demos as boas-vindas
          const alreadyWelcomed = await prisma.instagramFollower.findUnique({
            where: {
              instagramAccountId_instagramId: {
                instagramAccountId: account.id,
                instagramId: follower.pk.toString()
              }
            }
          });

          if (!alreadyWelcomed) {
            console.log(`[InstagramWorker] Novo seguidor detectado: ${follower.username}. Enviando boas-vindas...`);
            
            // Enviar DM
            const thread = ig.entity.directThread([follower.pk.toString()]);
            await thread.broadcastText(`Olá ${follower.full_name || follower.username}, seja bem-vindo(a) ao nosso perfil! Como podemos te ajudar hoje?`);

            // Registrar para não enviar de novo
            await prisma.instagramFollower.create({
              data: {
                instagramAccountId: account.id,
                instagramId: follower.pk.toString(),
                username: follower.username
              }
            });

            // Delay para evitar detecção de bot
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      } catch (error: any) {
        console.error(`[InstagramWorker] Erro na automação de boas-vindas para ${account.username}:`, error.message);
      }
    }
  }
}
