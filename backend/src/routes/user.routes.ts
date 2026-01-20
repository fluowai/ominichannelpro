import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { hashPassword } from '../lib/hash.js';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

export async function userRoutes(fastify: FastifyInstance) {
  // Update profile
  fastify.put('/profile', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      const data = updateUserSchema.parse(request.body);

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send({ user: updatedUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update password
  fastify.put('/password', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      const { currentPassword, newPassword } = updatePasswordSchema.parse(request.body);

      // Verify current password
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userData) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const bcrypt = await import('bcryptjs');
      const isPasswordValid = await bcrypt.compare(currentPassword, userData.password);

      if (!isPasswordValid) {
        return reply.code(401).send({ error: 'Current password is incorrect' });
      }

      // Update password
      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return reply.send({ message: 'Password updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get all users (admin only)
  fastify.get('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user as any;

      if (user.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ users });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
