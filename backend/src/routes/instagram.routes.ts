import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { InstagramService } from '../services/instagram.service.js';
import { InstagramPostType } from '@prisma/client';

export async function instagramRoutes(fastify: FastifyInstance) {
  const instagramService = InstagramService.getInstance();

  // Listar Contas do Instagram
  fastify.get('/accounts', { onRequest: [authenticate] }, async (request, reply) => {
    const userId = (request.user as any).id;
    let user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { organization: true }
    });
    
    // Auto-create organization if user doesn't have one
    if (!user?.organizationId) {
      const orgSlug = (user?.email || 'default').split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      const org = await prisma.organization.create({
        data: { 
          name: `Org ${user?.email || 'Default'}`,
          slug: orgSlug
        }
      });
      
      user = await prisma.user.update({
        where: { id: userId },
        data: { organizationId: org.id },
        include: { organization: true }
      });
    }

    const accounts = await prisma.instagramAccount.findMany({
      where: { organizationId: user.organizationId! },
      select: { id: true, username: true, status: true, isActive: true, createdAt: true }
    });
    return reply.send({ accounts });
  });

  // Adicionar/Conectar Conta
  fastify.post('/accounts', { onRequest: [authenticate] }, async (request, reply) => {
    const { password } = request.body as any;
    const username = (request.body as any).username?.trim();
    const userId = (request.user as any).id;

    console.log(`[InstagramRoute] POST /accounts - UserID: ${userId}`);

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { organization: true }
    });

    if (!user?.organizationId) {
      console.error(`[InstagramRoute] Erro: Usuário ${user?.email} sem organizationId`);
      return reply.code(400).send({ error: 'Organização não encontrada no seu perfil' });
    }

    try {
      const account = await prisma.instagramAccount.upsert({
        where: { username },
        update: { password, organizationId: user.organizationId },
        create: { username, password, organizationId: user.organizationId }
      });

      // Validar conexão/login (apenas login, sem postagem)
      await instagramService.validateAccount(account.id);
      
      return reply.code(201).send({ account });
    } catch (error: any) {
      console.error(`[InstagramRoute] Erro no login: ${error.message}`);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Agendar Post
  fastify.post('/posts', { onRequest: [authenticate] }, async (request, reply) => {
    const { accountId, type, caption, mediaUrls, scheduledAt } = request.body as any;

    try {
      const post = await prisma.instagramPost.create({
        data: {
          instagramAccountId: accountId,
          type: type as InstagramPostType,
          caption,
          mediaUrls,
          scheduledAt: new Date(scheduledAt),
          status: 'SCHEDULED'
        }
      });
      return reply.send({ post });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Executar Ação (Follow/Unfollow/DM)
  fastify.post('/actions', { onRequest: [authenticate] }, async (request, reply) => {
    const { accountId, action, targetUsername, text } = request.body as any;

    try {
      if (action === 'follow' || action === 'unfollow') {
        await instagramService.setRelationship(accountId, targetUsername, action);
      } else if (action === 'dm') {
        await instagramService.sendDirectMessage(accountId, targetUsername, text);
      } else if (action === 'post') {
        const { type, caption, mediaUrls } = request.body as any;
        await instagramService.uploadMedia(accountId, type, caption || '', mediaUrls);
      }
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });
}
