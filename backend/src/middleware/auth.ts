import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  request.log.info(`[AUTH] Verifying token for ${request.url}`);
  try {
    await request.jwtVerify();
    request.log.info(`[AUTH] Verified: ${(request.user as any)?.email}`);
  } catch (err: any) {
    request.log.error(`[AUTH] Failed: ${err.message}`);
    reply.code(401).send({ error: 'Unauthorized' });
  }
}

export async function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;
      
      if (!roles.includes(user.role)) {
        reply.code(403).send({ error: 'Forbidden' });
      }
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  };
}
