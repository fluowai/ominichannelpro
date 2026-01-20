import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

import { EvolutionService } from '../services/evolution.service.js';

export async function conversationRoutes(fastify: FastifyInstance) {
  // Get all conversations
  fastify.get('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      const { platform, status, integrationId } = request.query as { platform?: string; status?: string; integrationId?: string };

      const where: any = {};

      // If NOT Admin/SuperAdmin, restrict to assigned conversations
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        where.assignedToId = user.id;
      }
      
      // otherwise, they see everything (no ownership filter)

      if (platform) where.platform = platform.toUpperCase();
      if (status) where.status = status.toUpperCase();
      if (integrationId) where.integrationId = integrationId;

      console.log('[DEBUG_CONV] User:', { id: user.id, role: user.role });
      console.log('[DEBUG_CONV] Query Where:', JSON.stringify(where, null, 2));

      const conversations = await prisma.conversation.findMany({
        where,
        include: {
          contact: true,
          agent: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      console.log(`[DEBUG_CONV] Found ${conversations.length} conversations`);
      if (conversations.length > 0) {
        console.log('[DEBUG_CONV] First conv integrationId:', conversations[0].integrationId);
      }
      return reply.send({ conversations });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get single conversation with messages
  fastify.get('/:id', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
          contact: true,
          agent: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        return reply.code(404).send({ error: 'Conversation not found' });
      }

      // Mark as read
      await prisma.conversation.update({
        where: { id },
        data: { unreadCount: 0 },
      });

      return reply.send({ conversation });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Send message
  fastify.post('/:id/messages', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user as any;
      const { text, attachments } = request.body as { text: string; attachments?: any };

      const message = await prisma.message.create({
        data: {
          conversationId: id,
          text,
          sender: 'AGENT',
          userId: user.id,
          attachments,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      // Fetch conversation with Integration and Contact details
      const conversationDetails = await prisma.conversation.findUnique({
          where: { id },
          include: { 
              integration: true,
              contact: true
          }
      });

      if (!conversationDetails || !conversationDetails.integration) {
          throw new Error('Conversation or Integration not found');
      }

      // Update conversation timestamp
      const conversation = await prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      // Send via WebSocket to connected clients
      console.log('[WS] 📤 Preparing to broadcast AGENT message:', message.id);
      import('../websocket/connectionManager.js').then(({ connectionManager }) => {
        const broadcastPayload = {
            type: 'new_message',
            message: {
                ...message,
                integrationId: conversation.integrationId
            },
            conversationId: id,
            integrationId: conversation.integrationId
        };
        
        console.log('[WS] 📡 Broadcasting payload:', JSON.stringify(broadcastPayload, null, 2));
        connectionManager.broadcast(broadcastPayload);
        console.log('[WS] ✅ Broadcast sent successfully');
      }).catch(err => {
        console.error('[WS] ❌ Broadcast FAILED:', err);
      });

      // Send via Evolution API
      const integration = conversationDetails.integration;
      const contact = conversationDetails.contact;
      
      if (integration.type === 'EVOLUTION_API' && integration.status === 'CONNECTED') {
          // Resolve Config
          let instanceUrl = integration.instanceUrl;
          let apiKey = integration.apiKey;
          const config = integration.config as any;
          const instanceName = config?.instanceName || integration.name; // Fallback

          if (!instanceUrl || !apiKey) {
              const settings = await prisma.systemSettings.findUnique({ where: { key: 'evolution_api' } });
              if (settings?.value) {
                  const val = settings.value as any;
                  instanceUrl = instanceUrl || val.baseUrl;
                  apiKey = apiKey || val.globalApiKey;
              }
          }

          if (instanceUrl && apiKey && instanceName && contact.platformId) {
              try {
                  const evolution = new EvolutionService(instanceUrl, apiKey);
                  
                  if (attachments && attachments.length > 0) {
                      for (const att of attachments) {
                          const type = att.type === 'image' ? 'image' : att.type === 'video' ? 'video' : 'audio';
                          // Evolution typical media sending
                          await evolution.sendMedia(instanceName, contact.platformId, {
                              type: type as any,
                              url: `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3333'}${att.url}`,
                              caption: text
                          }, apiKey);
                      }
                  } else {
                      await evolution.sendText(instanceName, contact.platformId, text, apiKey);
                  }
                  console.log(`[API] Sent to Evolution: ${contact.platformId} on ${instanceName}`);
              } catch (evoError) {
                  console.error('[API] Evolution Send Error:', evoError);
              }
          }
      }

      // Send via WUZAPI
      if (integration.type === 'WUZAPI' && integration.status === 'CONNECTED') {
          const config = integration.config as any;
          const sessionId = config?.sessionId;
          const userToken = config?.userToken;

          const target = contact.platformId || contact.phone;

          if (integration.instanceUrl && userToken && sessionId && target) {
              console.log(`[WUZAPI_SEND] 📤 ATTEMPT: Dest: ${target}, Session: ${sessionId}, URL: ${integration.instanceUrl}`);
              try {
                  const { WuzapiService } = await import('../services/wuzapi.service.js');
                  const wuzapi = new WuzapiService(integration.instanceUrl, userToken);
                  
                  let result;
                  if (attachments && attachments.length > 0) {
                      for (const att of attachments) {
                          result = await wuzapi.sendMedia(sessionId, target, {
                              type: att.type as any,
                              url: `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3333'}${att.url}`,
                              caption: text,
                              filename: att.filename
                          });
                      }
                  } else {
                      result = await wuzapi.sendText(sessionId, target, text);
                  }
                  console.log(`[WUZAPI_SEND] ✅ SUCCESS: ${JSON.stringify(result)}`);
              } catch (wuzError: any) {
                  console.error('[WUZAPI_SEND] ❌ ERROR:', wuzError.response?.data || wuzError.message);
                  
                  if (wuzError.isAuthError || wuzError.response?.status === 401) {
                      console.warn(`[API] WUZAPI Auth Error for ${sessionId}. Marking integration as DISCONNECTED.`);
                      await prisma.integration.update({
                          where: { id: integration.id },
                          data: { status: 'DISCONNECTED' }
                      });
                  }
              }
          }
      }

      return reply.code(201).send({ message });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Assign conversation
  fastify.patch('/:id/assign', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { assignedToId } = request.body as { assignedToId: string };

      const conversation = await prisma.conversation.update({
        where: { id },
        data: { assignedToId },
      });

      return reply.send({ conversation });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update conversation status
  fastify.patch('/:id/status', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      const conversation = await prisma.conversation.update({
        where: { id },
        data: { status: status.toUpperCase() as any },
      });

      return reply.send({ conversation });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
  // Delete message
  fastify.delete('/:id/messages/:messageId', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id, messageId } = request.params as { id: string; messageId: string };
      
      await prisma.message.delete({
        where: { id: messageId }
      });

      // Broadcast deletion
      import('../websocket/connectionManager.js').then(({ connectionManager }) => {
        connectionManager.broadcast({
            type: 'message_deleted',
            conversationId: id,
            messageId: messageId
        });
      });

      return reply.send({ success: true });
    } catch (error) {
      console.error('Error deleting message:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

}
