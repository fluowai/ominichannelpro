
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export async function propertyRoutes(fastify: FastifyInstance) {
  // GET / - List all properties
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const properties = await prisma.property.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return properties;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch properties' });
    }
  });

  // POST / - Create property
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const createSchema = z.object({
      code: z.string(),
      title: z.string(),
      description: z.string(),
      price: z.number(),
      type: z.string(),
      city: z.string(),
      bedrooms: z.number(),
      bathrooms: z.number(),
      area: z.number(),
      images: z.array(z.string()).optional().default([])
    });

    try {
      const data = createSchema.parse(request.body);
      const property = await prisma.property.create({
        data
      });
      return reply.code(201).send(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to create property' });
    }
  });

  // PUT /:id - Update property
  fastify.put('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string() });
    const updateSchema = z.object({
      code: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      type: z.string().optional(),
      city: z.string().optional(),
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
      area: z.number().optional(),
      images: z.array(z.string()).optional()
    });

    try {
      const { id } = paramsSchema.parse(request.params);
      const data = updateSchema.parse(request.body);
      
      const property = await prisma.property.update({
        where: { id },
        data
      });
      return property;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to update property' });
    }
  });

  // DELETE /:id - Delete property
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string() });
    try {
      const { id } = paramsSchema.parse(request.params);
      await prisma.property.delete({
        where: { id }
      });
      return reply.send({ message: 'Property deleted' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete property' });
    }
  });
}
