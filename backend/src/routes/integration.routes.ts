import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { EvolutionService } from '../services/evolution.service.js';
import axios from 'axios';

// Helper to get Evolution config (Local or Global)
async function getEvolutionConfig(integration: any) {
  let instanceUrl = integration.instanceUrl;
  let apiKey = integration.apiKey;
  let publicUrl = undefined;

  if (!instanceUrl || !apiKey) {
    const settings = await prisma.systemSettings.findUnique({
      where: { key: 'evolution_api' }
    });
    if (settings?.value) {
      const val = settings.value as any;
      instanceUrl = instanceUrl || val.baseUrl;
      apiKey = apiKey || val.globalApiKey;
      publicUrl = val.publicUrl;
    }
    
    // Fallback to Environment Variables (Hardcoded)
    if (!instanceUrl) instanceUrl = process.env.EVOLUTION_API_URL;
    if (!apiKey) apiKey = process.env.EVOLUTION_API_KEY;
  } else {
     // Even if instanceUrl/key are specific, we might still need global publicUrl for webhook
     const settings = await prisma.systemSettings.findUnique({ where: { key: 'evolution_api' } });
     if(settings?.value) {
        publicUrl = (settings.value as any).publicUrl;
     }
  }
  return { instanceUrl, apiKey, publicUrl };
}

// Helper to sanitize instance name
function sanitizeInstanceName(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-zA-Z0-9]/g, "-")   // Replace special chars with dash
        .replace(/-+/g, "-")             // Remove duplicate dashes
        .replace(/^-|-$/g, "")           // Remove leading/trailing dashes
        .toLowerCase();
}

export async function integrationRoutes(fastify: FastifyInstance) {
  console.log('[ROUTES] Integration routes registered');
  // Get all integrations
  fastify.get('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id, role } = request.user as any;
      const query = request.query as { scope?: string };
      
      const user = await prisma.user.findUnique({ where: { id } });

      let whereClause: any = {};

      if (role === 'SUPER_ADMIN') {
          whereClause = {}; 
      } else {
          if (!user?.organizationId) {
             return reply.send({ integrations: [] });
          }
          whereClause = { organizationId: user.organizationId };
      }
      
      const integrations = await prisma.integration.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
      
      return reply.send({ integrations });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create integration
  fastify.post('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { name, type, apiKey, instanceUrl, config } = request.body as any;

      // Fetch User to get Org ID
      const user = await prisma.user.findUnique({ where: { id: (request.user as any).id } });

      // Sanitize instance name for Evolution API
      const instanceName = type === 'EVOLUTION_API' ? sanitizeInstanceName(name) : undefined;

      // Create local record
      const integration = await prisma.integration.create({
        data: {
          name,
          type,
          apiKey,
          instanceUrl,
          instanceName,
          config,
          status: 'DISCONNECTED',
          organizationId: user?.organizationId
        },
      });

      // If Evolution API, try to create instance remotely AND configure webhook
      if (type === 'EVOLUTION_API') {
        const { instanceUrl: finalUrl, apiKey: finalKey } = await getEvolutionConfig(integration);

        if (finalUrl && finalKey && instanceName) {
          const evolution = new EvolutionService(finalUrl, finalKey);
          try {
            // 1. Create instance in Evolution API
            await evolution.createInstance(instanceName);
            console.log(`✅ Instance created: ${instanceName}`);
            
            // 2. Configure webhook automatically
            try {
              const { getPublicUrl } = await import('../utils/getPublicUrl.js');
              const publicUrl = await getPublicUrl();
              const webhookUrl = `${publicUrl}/webhook/evolution/${instanceName}`;
              
              await evolution.setWebhook(
                instanceName,
                webhookUrl,
                true,
                finalKey
              );
              
              console.log(`✅ Webhook configured: ${webhookUrl}`);
              
              // Save webhook URL to database
              await prisma.integration.update({
                where: { id: integration.id },
                data: { webhookUrl }
              });
              
            } catch (webhookError: any) {
              console.error('❌ Failed to configure webhook:', webhookError.message);
              // Don't fail the integration creation because of webhook
            }
            
          } catch (e: any) {
            console.warn('Failed to auto-create instance on Evolution:', e.message);
            // Log to file
            const fs = await import('fs');
            fs.appendFileSync('evolution_debug.log', `[CREATE_AUTO] Error: ${JSON.stringify(e.response?.data || e.message)}\n`);
          }
        }
      }

      // Fetch updated integration with webhook URL
      const updatedIntegration = await prisma.integration.findUnique({
        where: { id: integration.id }
      });

      return reply.code(201).send({ integration: updatedIntegration });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/:id/connect', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    request.log.info(`[CONNECT] Request for ID: ${(request.params as any).id}`);
    
    try {
      const { id } = request.params as { id: string };
      console.log(`[CONNECT ROUTE] Looking for integration with ID: ${id}`);

      const integration = await prisma.integration.findUnique({
        where: { id },
      });

      console.log(`[CONNECT ROUTE] Integration found:`, integration ? `${integration.name} (${integration.type})` : 'NOT FOUND');

      if (!integration) {
          console.error('[CONNECT ROUTE] Integration not found, returning 404');
          return reply.code(404).send({ error: 'Integration not found' });
      }

      // HANDLE EVOLUTION API
      if (integration.type === 'EVOLUTION_API') {
        const { instanceUrl, apiKey } = await getEvolutionConfig(integration);
        const config = integration.config as any;
        const instanceName = config?.instanceName || sanitizeInstanceName(integration.name);

        if (!instanceUrl || !apiKey) {
            return reply.code(400).send({ error: 'Configuração da Evolution API não encontrada (nem local, nem global).' });
        }

      const evolution = new EvolutionService(instanceUrl, apiKey);
      
      try {
        const data = await evolution.fetchQrCode(instanceName, apiKey);
        
        if (data?.instance?.state === 'open') {
             await prisma.integration.update({
                where: { id },
                data: { status: 'CONNECTED' }
             });

             // Auto-configure Webhook
             const { publicUrl } = await getEvolutionConfig(integration);
             if (publicUrl) {
                const webhookUrl = `${publicUrl}/api/webhooks/evolution`;
                await evolution.setWebhook(instanceName, webhookUrl, true, apiKey);
                console.log(`[Auto-Config] Webhook set for ${instanceName} to ${webhookUrl}`);
             }

             return reply.send({ status: 'CONNECTED' });
        }

        return reply.send({ 
            status: 'QR_CODE', 
            qrcode: data.base64 || data.qrcode?.base64 
        });

      } catch (e: any) {
        console.error('Evolution Connect Error:', e.response?.data || e.message);
        
        // Log to file
        const fs = await import('fs');
        fs.appendFileSync('evolution_debug.log', `[CONNECT] Error for ${instanceName}: ${JSON.stringify(e.response?.data || e.message)}\n`);

        // If 404, try creating
        if (e.response?.status === 404 || e.message.includes('not found') || e.message.includes('instance not found')) {
            try {
                await evolution.createInstance(instanceName);
                const data = await evolution.fetchQrCode(instanceName, apiKey);
                return reply.send({ 
                    status: 'QR_CODE', 
                    qrcode: data.base64 || data.qrcode?.base64 
                });
            } catch (createErr: any) {
                console.error('Create Instance Error:', createErr.response?.data || createErr.message);
                fs.appendFileSync('evolution_debug.log', `[CREATE_RETRY] Error: ${JSON.stringify(createErr.response?.data || createErr.message)}\n`);
                
                return reply.code(500).send({ 
                    error: `Falha ao criar instância: ${createErr.response?.data?.message || createErr.message}` 
                });
            }
        }
        return reply.code(500).send({ error: e.response?.data?.message || 'Erro ao conectar com Evolution API' });
      }
    } else {
        return reply.code(400).send({ error: 'Tipo de integração não suportado' });
    }

    } catch (error: any) {
      console.error('Route Internatl Error:', error);
      return reply.code(500).send({ error: error.message || 'Internal server error' });
    }
  });

  // Check Status
  fastify.get('/:id/status', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const integration = await prisma.integration.findUnique({ where: { id } });

      if (!integration) return reply.code(404).send({ error: 'Integration not found' });

      if (integration.type !== 'EVOLUTION_API') return reply.send({ status: integration.status });

      const { instanceUrl, apiKey } = await getEvolutionConfig(integration);
      const config = integration.config as any;
      const instanceName = config?.instanceName || sanitizeInstanceName(integration.name);

      if(instanceUrl && apiKey) {
          const evolution = new EvolutionService(instanceUrl, apiKey);
          try {
            const state = await evolution.getConnectionState(instanceName, apiKey);
            const newStatus = state?.instance?.state === 'open' ? 'CONNECTED' : 'DISCONNECTED';
            
            if(newStatus !== integration.status) {
                await prisma.integration.update({
                    where: { id },
                    data: { status: newStatus }
                });

                // If just connected, ensure webhook is set
                if (newStatus === 'CONNECTED') {
                    const { publicUrl } = await getEvolutionConfig(integration);
                    if (publicUrl) {
                        const webhookUrl = `${publicUrl}/api/webhooks/evolution`;
                        await evolution.setWebhook(instanceName, webhookUrl, true, apiKey);
                        console.log(`[Auto-Config] Webhook set for ${instanceName} to ${webhookUrl}`);
                    }
                }
            }
            return reply.send({ status: newStatus });
          } catch (e) {
             // If error checking status, just return current status or ERROR
             return reply.send({ status: 'ERROR' });
          }
      }

      return reply.send({ status: integration.status });

    } catch (error) {
       return reply.code(500).send({ error: 'Failed to check status' });
    }
  });

  // Update integration (e.g. link agent or update settings)
  fastify.patch('/:id', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { agentId, config } = request.body as { agentId?: string; config?: any };

      const current = await prisma.integration.findUnique({ where: { id } });
      if (!current) return reply.code(404).send({ error: 'Not found' });

      const newConfig = config ? { ...(current.config as object), ...config } : current.config;

      const data: any = {};
      if (agentId !== undefined) data.agentId = agentId;
      if (config !== undefined) data.config = newConfig;

      const integration = await prisma.integration.update({
        where: { id },
        data,
        include: { agent: true }
      });

      return reply.send({ integration });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Delete integration
  fastify.delete('/:id', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
        const { id } = request.params as { id: string };
        const integration = await prisma.integration.findUnique({ where: { id } });
        
        if (integration?.type === 'EVOLUTION_API') {
             // ... Evolution logic (unchanged)
             const { instanceUrl, apiKey } = await getEvolutionConfig(integration);
             const config = integration.config as any;
             const instanceName = config?.instanceName || sanitizeInstanceName(integration.name);
             
             if(instanceUrl && apiKey) {
                 const evolution = new EvolutionService(instanceUrl, apiKey);
                 try {
                    await evolution.logout(instanceName, apiKey);
                    await evolution.deleteInstance(instanceName, apiKey);
                 } catch (e) {
                    console.warn('Failed to delete remote instance', e);
                 }
             }
        }

        await prisma.integration.delete({ where: { id } });
        return reply.send({ message: 'Deleted' });
    } catch (error) {
       console.error(error);
       return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Fetch WhatsApp Groups
  fastify.get('/:id/groups', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const integration = await prisma.integration.findUnique({ where: { id } });

      if (!integration || integration.type !== 'EVOLUTION_API') {
        return reply.code(400).send({ error: 'Invalid integration' });
      }

      const { instanceUrl, apiKey } = await getEvolutionConfig(integration);
      const config = integration.config as any;
      const instanceName = config?.instanceName || sanitizeInstanceName(integration.name);

      if (!instanceUrl || !apiKey) {
        return reply.code(400).send({ error: 'Evolution API configuration not found' });
      }

      const evolution = new EvolutionService(instanceUrl, apiKey);
      const groups = await evolution.fetchGroups(instanceName, apiKey);

      return reply.send({ groups });
    } catch (error: any) {
      console.error('Fetch Groups Error:', error);
      return reply.code(500).send({ error: error.message || 'Failed to fetch groups' });
    }
  });

  // Fetch Group Participants
  fastify.get('/:id/groups/:groupId/participants', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id, groupId } = request.params as { id: string; groupId: string };
      const integration = await prisma.integration.findUnique({ where: { id } });

      if (!integration || integration.type !== 'EVOLUTION_API') {
        return reply.code(400).send({ error: 'Invalid integration' });
      }

      const { instanceUrl, apiKey } = await getEvolutionConfig(integration);
      const config = integration.config as any;
      const instanceName = config?.instanceName || sanitizeInstanceName(integration.name);

      if (!instanceUrl || !apiKey) {
        return reply.code(400).send({ error: 'Evolution API configuration not found' });
      }

      console.log(`[Backend] Fetching participants for Group: ${groupId} (Instance: ${instanceName})`);

      const evolution = new EvolutionService(instanceUrl, apiKey);
      const participants = await evolution.fetchGroupParticipants(instanceName, groupId, apiKey);

      console.log(`[Backend] Found ${participants?.length || 0} participants`);
      return reply.send({ participants });
    } catch (error: any) {
      console.error('Fetch Group Participants Error:', error);
      console.error('Evolution Error Details:', error.response?.data);
      
      const helpfulError = error.response?.data?.message || error.message;
      return reply.code(500).send({ error: `Evolution API Error: ${helpfulError}` });
    }
  });

  // Test Webhook
  fastify.post('/:id/test-webhook', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const integration = await prisma.integration.findUnique({
        where: { id }
      });
      
      if (!integration || !integration.webhookUrl) {
        return reply.code(404).send({ error: 'Webhook not configured' });
      }
      
      // Send test message to webhook
      try {
        const axios = (await import('axios')).default;
        await axios.post(integration.webhookUrl, {
          type: 'test',
          message: 'Teste de webhook do sistema FLUOW AI',
          timestamp: new Date().toISOString(),
          integration: {
            id: integration.id,
            name: integration.name
          }
        }, {
          timeout: 5000
        });
        
        return reply.send({ 
          success: true, 
          message: 'Webhook testado com sucesso',
          webhookUrl: integration.webhookUrl
        });
      } catch (error: any) {
        return reply.code(500).send({ 
          error: 'Falha ao testar webhook',
          details: error.message,
          webhookUrl: integration.webhookUrl
        });
      }
    } catch (error: any) {
      console.error('Test Webhook Error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

}
