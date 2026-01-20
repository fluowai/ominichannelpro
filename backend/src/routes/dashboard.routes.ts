
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/stats', async (request: any) => {
    const userId = request.user.id;

    const [
      agentsCount,
      activeAgentsCount,
      conversationsCount,
      openConversationsCount,
      messagesCount,
      campaignsCount
    ] = await Promise.all([
      prisma.agent.count({ where: { userId } }),
      prisma.agent.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.conversation.count(), // In a real app, filter by user/org
      prisma.conversation.count({ where: { status: 'OPEN' } }),
      prisma.message.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }), // Messages today
      prisma.campaign.count({ where: { userId } })
    ]);

    return {
      agents: {
        total: agentsCount,
        active: activeAgentsCount
      },
      conversations: {
        total: conversationsCount,
        open: openConversationsCount
      },
      messages: {
        today: messagesCount
      },
      campaigns: {
        total: campaignsCount
      }
    };
  });

  app.get('/history', async () => {
    const days = 7;
    const history = [];

    // Simple history: messages per day in the last 7 days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [inbound, outbound] = await Promise.all([
        prisma.message.count({
          where: {
            sender: 'USER',
            createdAt: { gte: date, lt: nextDate }
          }
        }),
        prisma.message.count({
          where: {
            OR: [{ sender: 'AGENT' }, { sender: 'SYSTEM' }],
            createdAt: { gte: date, lt: nextDate }
          }
        })
      ]);

      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' })
        .replace('.', '');
      
      history.push({
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        leads: inbound,
        vendas: outbound // Using "vendas" to match frontend mock keys for now
      });
    }

    return { history };
  });
}
