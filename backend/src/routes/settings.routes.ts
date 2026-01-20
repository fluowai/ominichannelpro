import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

export async function settingsRoutes(fastify: FastifyInstance) {
  // Get all settings
  fastify.get('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const settings = await prisma.systemSettings.findMany();
      // Convert array to object for easier consumption
      const settingsMap = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, any>);
      
      return reply.send(settingsMap);
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get specific setting
  fastify.get('/:key', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { key } = request.params as { key: string };
      const setting = await prisma.systemSettings.findUnique({
        where: { key }
      });
      
      if (!setting) {
        return reply.code(404).send({ error: 'Setting not found' });
      }
      
      return reply.send(setting.value);
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update/Create setting
  fastify.post('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
        // Validation schema
        const updateSchema = z.object({
            key: z.string(),
            value: z.any(),
            description: z.string().optional()
        });

        const { key, value, description } = updateSchema.parse(request.body);

        // Check if user is ADMIN (optional validation, skipping for now to keep simple)
        
        const setting = await prisma.systemSettings.upsert({
            where: { key },
            update: { 
                value,
                description 
            },
            create: {
                key,
                value,
                description
            }
        });

        return reply.send(setting);

    } catch (error) {
      console.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Fetch Evolution Instances Proxy
  fastify.get('/evolution/instances', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
       // Get global settings
       const settings = await prisma.systemSettings.findUnique({
         where: { key: 'evolution_api' }
       });
       
       // Fallback to Env
       let baseUrl = process.env.EVOLUTION_API_URL;
       let globalApiKey = process.env.EVOLUTION_API_KEY;

       if (settings?.value) {
           const val = settings.value as any;
           if (val.baseUrl) baseUrl = val.baseUrl;
           if (val.globalApiKey) globalApiKey = val.globalApiKey;
       }

       if (!baseUrl || !globalApiKey) {
         return reply.code(400).send({ error: 'Evolution API not configured globally' });
       }
       
       // Import service dynamically
       const { EvolutionService } = await import('../services/evolution.service.js');
       const evoService = new EvolutionService(baseUrl, globalApiKey);

       const instances = await evoService.fetchAllInstances();
       return reply.send(instances);

    } catch (error: any) {
      const fs = await import('fs');
      const path = await import('path');
      const logLog = path.resolve(process.cwd(), 'evolution_error.log');
      fs.writeFileSync(logLog, `Evo Error: ${JSON.stringify(error.message)}\nStack: ${error.stack}\n`, { flag: 'a' });

      console.error('Proxy Error:', error);
      return reply.code(500).send({ error: error.message || 'Failed to fetch instances' });
    }
  });


}
