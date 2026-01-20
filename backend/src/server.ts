import 'dotenv/config'; // MUST BE FIRST
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import websocket from '@fastify/websocket';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Start server functional declaration
const start = async () => {
  try {
    // 1. CORS
    await fastify.register(cors, {
      origin: '*', 
      credentials: false,
    });

    // 2. ERROR HANDLER
    fastify.setErrorHandler((error: any, request, reply) => {
      fastify.log.error(`[GLOBAL ERROR] ${error.statusCode} ${error.message}`);
      reply.status(error.statusCode || 500).send({ 
        error: error.message,
        statusCode: error.statusCode
      });
    });

    // 3. AUTH (JWT)
    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });

    // 4. UTILS
    await fastify.register(multipart);
    await fastify.register(staticPlugin, {
      root: path.join(__dirname, '../uploads'),
      prefix: '/uploads/',
      decorateReply: false
    });
    
    // 5. WEBSOCKET ENGINE
    await fastify.register(websocket);

    // 6. DECORATORS
    fastify.decorate('authenticate', async function(request: any, reply: any) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    });

    // 7. BASE ROUTES
    fastify.get('/', async () => ({ status: 'online', message: 'Fluow AI API 🚀' }));
    fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date() }));

    // 8. DYNAMIC IMPORT ROUTES (Prevent early Prisma init)
    const { authRoutes } = await import('./routes/auth.routes.js');
    const { agentRoutes } = await import('./routes/agent.routes.js');
    const { conversationRoutes } = await import('./routes/conversation.routes.js');
    const { campaignRoutes } = await import('./routes/campaign.routes.js');
    const { integrationRoutes } = await import('./routes/integration.routes.js');
    const { settingsRoutes } = await import('./routes/settings.routes.js');
    const { userRoutes } = await import('./routes/user.routes.js');
    const { dashboardRoutes } = await import('./routes/dashboard.routes.js');
    const { aiRoutes } = await import('./routes/ai.routes.js');
    const { webhookRoutes } = await import('./routes/webhook.routes.js');
    const { propertyRoutes } = await import('./routes/property.routes.js');
    const { contactsRoutes } = await import('./routes/contacts.routes.js');
    const { contactListsRoutes } = await import('./routes/contactLists.routes.js');
    const { kanbanRoutes } = await import('./routes/kanban.routes.js');
    const { chatRoutes } = await import('./routes/chat.routes.js');
    const { instagramRoutes } = await import('./routes/instagram.routes.js');
    const { sseRoutes } = await import('./routes/sse.routes.js');
    const { mediaRoutes } = await import('./routes/media.routes.js');

    // API GROUP
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(agentRoutes, { prefix: '/api/agents' });
    await fastify.register(propertyRoutes, { prefix: '/api/properties' });
    await fastify.register(conversationRoutes, { prefix: '/api/conversations' });
    await fastify.register(campaignRoutes, { prefix: '/api/campaigns' });
    await fastify.register(integrationRoutes, { prefix: '/api/integrations' });
    await fastify.register(userRoutes, { prefix: '/api/users' });
    await fastify.register(dashboardRoutes, { prefix: '/api/dashboard' });
    await fastify.register(settingsRoutes, { prefix: '/api/settings' });
    await fastify.register(aiRoutes, { prefix: '/api/ai' });
    await fastify.register(webhookRoutes, { prefix: '/api/webhooks' });
    await fastify.register(webhookRoutes, { prefix: '/webhook' }); 
    await fastify.register(contactsRoutes, { prefix: '/api/contacts' });
    await fastify.register(contactListsRoutes, { prefix: '/api/contact-lists' });
    await fastify.register(kanbanRoutes, { prefix: '/api/kanban' });
    await fastify.register(instagramRoutes, { prefix: '/api/instagram' });
    await fastify.register(sseRoutes, { prefix: '/api/sse' });
    await fastify.register(mediaRoutes, { prefix: '/api/media' });
    
    // 9. CHAT WEBSOCKET (Absolute Path)
    await fastify.register(chatRoutes);

    // 10. SERVER START
    const port = parseInt(process.env.PORT || '3333');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${port}`);

    // 11. BACKGROUND SERVICES (Start only after server is up)
    try {
        const { InstagramService } = await import('./services/instagram.service.js');
        const instagramService = InstagramService.getInstance();
        instagramService.startWorkers();
        console.log('[SERVICES] Instagram Workers Started');
    } catch (e) {
        console.error('[SERVICES] Failed to start background workers:', e);
    }

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
