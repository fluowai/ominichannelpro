import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const createAgentSchema = z.object({
  name: z.string().min(2),
  provider: z.enum(['GEMINI', 'OPENAI', 'GROQ']),
  model: z.string(),
  prompt: z.string().min(10),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().min(1).max(4000).optional().default(1000),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  apiKey: z.string().optional(),
  skills: z.array(z.string()).optional().default([]),
  ignoreGroups: z.boolean().optional().default(true),
});

const updateAgentSchema = createAgentSchema.partial();

export async function agentRoutes(fastify: FastifyInstance) {
  // Get all agents
  fastify.get('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      
      const agents = await prisma.agent.findMany({
        where: {
          OR: [
            { userId: user.id },
            { organizationId: user.organizationId }
          ]
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return reply.send({ agents });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get single agent
  fastify.get('/:id', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user as any;

      const agent = await prisma.agent.findFirst({
        where: {
          id,
          OR: [
            { userId: user.id },
            { organizationId: user.organizationId }
          ]
        },
      });

      if (!agent) {
        return reply.code(404).send({ error: 'Agent not found' });
      }

      return reply.send({ agent });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create agent
  fastify.post('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      const data = createAgentSchema.parse(request.body);

      const agent = await prisma.agent.create({
        data: {
          ...data,
          userId: user.id,
          organizationId: user.organizationId // Save org ID
        },
      });

      return reply.code(201).send({ agent });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update agent
  fastify.put('/:id', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user as any;
      const data = updateAgentSchema.parse(request.body);

      // Check ownership
      const existingAgent = await prisma.agent.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!existingAgent) {
        return reply.code(404).send({ error: 'Agent not found' });
      }

      const agent = await prisma.agent.update({
        where: { id },
        data,
      });

      return reply.send({ agent });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete agent
  fastify.delete('/:id', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user as any;

      // Check ownership
      const existingAgent = await prisma.agent.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!existingAgent) {
        return reply.code(404).send({ error: 'Agent not found' });
      }

      await prisma.agent.delete({
        where: { id },
      });

      return reply.send({ message: 'Agent deleted successfully' });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
