import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const createCampaignSchema = z.object({
  name: z.string().min(2),
  message: z.string().min(1),
  platform: z.enum(['WHATSAPP', 'INSTAGRAM', 'MESSENGER']),
  audience: z.string(),
  contactIds: z.array(z.string()),
  scheduledAt: z.string().optional(),
});

export async function campaignRoutes(fastify: FastifyInstance) {
  // Get all campaigns
  fastify.get('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user as any;

      const campaigns = await prisma.campaign.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return reply.send({ campaigns });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create campaign
  fastify.post('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      const data = createCampaignSchema.parse(request.body);

      const campaign = await prisma.campaign.create({
        data: {
          ...data,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
          userId: user.id,
        },
      });

      // TODO: If scheduled, add to queue
      // TODO: If immediate, start sending

      return reply.code(201).send({ campaign });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get campaign stats
  fastify.get('/:id/stats', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user as any;

      const campaign = await prisma.campaign.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!campaign) {
        return reply.code(404).send({ error: 'Campaign not found' });
      }

      const stats = {
        total: campaign.contactIds.length,
        sent: campaign.sentCount,
        delivered: campaign.deliveredCount,
        read: campaign.readCount,
        errors: campaign.errorCount,
        deliveryRate: campaign.sentCount > 0 ? (campaign.deliveredCount / campaign.sentCount) * 100 : 0,
        readRate: campaign.deliveredCount > 0 ? (campaign.readCount / campaign.deliveredCount) * 100 : 0,
      };

      return reply.send({ campaign, stats });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete campaign
  fastify.delete('/:id', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user as any;

      const campaign = await prisma.campaign.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!campaign) {
        return reply.code(404).send({ error: 'Campaign not found' });
      }

      if (campaign.status === 'SENDING') {
        return reply.code(400).send({ error: 'Cannot delete campaign while sending' });
      }

      await prisma.campaign.delete({
        where: { id },
      });

      return reply.send({ message: 'Campaign deleted successfully' });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
