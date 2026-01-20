import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../lib/hash.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, name } = registerSchema.parse(request.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      
      // Check if this is the first user
      const userCount = await prisma.user.count();
      const role = userCount === 0 ? 'SUPER_ADMIN' : 'AGENT';

      // ✅ Always create organization for new users
      const orgSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      const organization = await prisma.organization.create({
        data: {
          name: `${name}'s Organization`,
          slug: orgSlug,
          plan: role === 'SUPER_ADMIN' ? 'ENTERPRISE' : 'FREE'
        }
      });

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          organizationId: organization.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          organizationId: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const accessToken = fastify.jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        { expiresIn: '15m' }
      );

      const refreshToken = fastify.jwt.sign(
        { id: user.id, type: 'refresh' },
        { expiresIn: '7d' }
      );

      // Save refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return reply.code(201).send({
        user,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('REGISTRATION ERROR:', error); // Log detalhado
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error', details: (error as any).message });
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const accessToken = fastify.jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        { expiresIn: '15m' }
      );

      const refreshToken = fastify.jwt.sign(
        { id: user.id, type: 'refresh' },
        { expiresIn: '7d' }
      );

      // Save refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const { password: _, ...userWithoutPassword } = user;

      return reply.send({
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };

      if (!refreshToken) {
        return reply.code(400).send({ error: 'Refresh token required' });
      }

      // Verify refresh token
      const decoded = fastify.jwt.verify(refreshToken) as any;

      // Check if token exists in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        return reply.code(401).send({ error: 'Invalid or expired refresh token' });
      }

      // Generate new access token
      const accessToken = fastify.jwt.sign(
        { id: tokenRecord.user.id, email: tokenRecord.user.email, role: tokenRecord.user.role },
        { expiresIn: '15m' }
      );

      return reply.send({ accessToken });
    } catch (error) {
      return reply.code(401).send({ error: 'Invalid refresh token' });
    }
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };

      if (refreshToken) {
        await prisma.refreshToken.delete({
          where: { token: refreshToken },
        }).catch(() => {});
      }

      return reply.send({ message: 'Logged out successfully' });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get current user
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          bio: true,
          twoFactorEnabled: true,
          createdAt: true,
          updatedAt: true,
          organizationId: true, // Added
        },
      });

      if (!userData) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send({ user: userData });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
