import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { llmService } from '../services/llm.service.js';
import { EvolutionService } from '../services/evolution.service.js';
import { mediaService } from '../services/media.service.js';
import { TOOLS } from '../config/tools.js';
import { connectionManager } from '../websocket/connectionManager.js';

async function getEvolutionConfig(integration: any) {
    let instanceUrl = integration.instanceUrl;
    let apiKey = integration.apiKey;
  
    if (!instanceUrl || !apiKey) {
      const settings = await prisma.systemSettings.findUnique({
        where: { key: 'evolution_api' }
      });
      if (settings?.value) {
        const val = settings.value as any;
        instanceUrl = instanceUrl || val.baseUrl;
        apiKey = apiKey || val.globalApiKey;
      }
    }
    return { instanceUrl, apiKey };
  }

/**
 * Extrai número de telefone limpo do JID do WhatsApp
 * CRITICAL: @lid IDs are NOT phone numbers! They are internal WhatsApp Business IDs.
 * Only @s.whatsapp.net contains real phone numbers.
 * @param remoteJid - ID principal (ex: "5548988003260@s.whatsapp.net" or "104565810663442@lid")
 * @param remoteJidAlt - ID alternativo (ex: "5548988003260@s.whatsapp.net")
 * @returns Telefone formatado ou 'UNKNOWN' se não for possível extrair
 */
function extractPhoneFromJid(remoteJid: string, remoteJidAlt?: string): string {
    // Prioriza remoteJidAlt se disponível
    let sourceJid = remoteJidAlt || remoteJid;
    
    // ❌ REJECT @lid IDs - they are NOT phone numbers!
    if (sourceJid.includes('@lid')) {
        console.warn(`[PHONE_EXTRACT] Rejecting @lid ID: ${sourceJid} - not a phone number`);
        
        // Try remoteJidAlt if remoteJid was @lid
        if (remoteJidAlt && !remoteJidAlt.includes('@lid')) {
            sourceJid = remoteJidAlt;
        } else if (!remoteJid.includes('@lid')) {
            sourceJid = remoteJid;
        } else {
            // Both are @lid, cannot extract phone
            return 'UNKNOWN';
        }
    }
    
    // Remove sufixo (@s.whatsapp.net, @g.us) e sufixo de dispositivo (:1, :20)
    let phonePart = sourceJid.split('@')[0];
    let phone = phonePart.split(':')[0];
    
    // Remove caracteres não numéricos (mantém apenas dígitos)
    phone = phone.replace(/\D/g, '');
    
    // Validate: phone should be 10-13 digits
    if (phone.length < 10 || phone.length > 13) {
        console.warn(`[PHONE_EXTRACT] Invalid phone length: ${phone.length} digits`);
        return 'UNKNOWN';
    }
    
    // ✅ Add Brazil code if missing
    if (!phone.startsWith('55') && phone.length >= 10) {
        phone = '55' + phone;
    }
    
    return phone;
}


export async function webhookRoutes(fastify: FastifyInstance) {
    // Health check for webhook
    fastify.get('/evolution', async (request, reply) => {
        return { status: 'online', message: 'Webhook endpoint is reachable' };
    });

    // Webhook receiver for Evolution API
const handleEvolutionWebhook = async (request: any, reply: any) => {
        try {
            const fs = await import('fs');
            fs.appendFileSync('webhook_hits.log', `[${new Date().toISOString()}] HIT Evolution: ${request.method} ${request.url}\n`);
        } catch(e){}
        
        console.log('[WEBHOOK] 🔔 HIT! Request received at /evolution (or wildcard)');
        try {
            const body = request.body as any;
            console.log('[WEBHOOK] Body Type:', body.type);
            
            // Validate event type
            const eventType = body.type || body.event;
            
            if (eventType !== 'messages.upsert') {
                return reply.send({ status: 'ignored' });
            }

            const messageData = body.data;
            
            // DEBUG: Log key details (Expanded)
            console.log('[WEBHOOK] FULL PAYLOAD:', JSON.stringify(body, null, 2));

            
            // 1. DETERMINE SENDER TYPE (User vs Agent/Me)
            let senderType: 'USER' | 'AGENT' = 'USER';
            if (messageData?.key?.fromMe === true || messageData?.key?.fromMe === 'true') {
                 senderType = 'AGENT';
                 console.log('[WEBHOOK] Message is FROM ME (Phone/System). Saving as AGENT.');
            }

            if (!messageData || !messageData.key) {
                 return reply.send({ status: 'ignored', reason: 'invalid_key' });
            }

            const instanceName = body.instance || request.params.instanceName;
            const remoteJid = messageData.key.remoteJid; 
            const remoteJidAlt = messageData.key.remoteJidAlt;
            
            // ... (JID Logging omitted) ...
            
            // Extract text and media
            const text = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || '';
            
            let mediaType: string | null = null;
            let mediaUrl: string | null = null;
            let mediaFilename: string | null = null;
            let mediaMimeType: string | null = null;
            let mediaSize: number | null = null;
            let caption: string | null = null;

            if (messageData.message?.imageMessage) {
                mediaType = 'image';
                mediaUrl = messageData.message.imageMessage.url;
                mediaMimeType = messageData.message.imageMessage.mimetype;
                mediaSize = messageData.message.imageMessage.fileLength;
                caption = messageData.message.imageMessage.caption;
            } else if (messageData.message?.audioMessage) {
                mediaType = messageData.message.audioMessage.ptt ? 'voice' : 'audio';
                mediaUrl = messageData.message.audioMessage.url;
                mediaMimeType = messageData.message.audioMessage.mimetype;
            } else if (messageData.message?.videoMessage) {
                mediaType = 'video';
                mediaUrl = messageData.message.videoMessage.url;
                mediaMimeType = messageData.message.videoMessage.mimetype;
                mediaSize = messageData.message.videoMessage.fileLength;
                caption = messageData.message.videoMessage.caption;
            } else if (messageData.message?.documentMessage) {
                mediaType = 'document';
                mediaUrl = messageData.message.documentMessage.url;
                mediaMimeType = messageData.message.documentMessage.mimetype;
                mediaFilename = messageData.message.documentMessage.fileName;
                mediaSize = messageData.message.documentMessage.fileLength;
            }

            // Skip if no text AND no media
            if (!text && !mediaUrl || !instanceName) {
                return reply.send({ status: 'ignored', reason: 'no_content_or_instance' });
            }
            
            // Finding the integration using the local database
            const integrations = await prisma.integration.findMany({
                where: { type: 'EVOLUTION_API', status: 'CONNECTED' },
                include: { agent: true }
            });

            // LOG ALL INTEGRATIONS FOR DEBUGGING
            console.log(`[WEBHOOK] Finding integration for instance: "${instanceName}"...`);
            console.log(`[WEBHOOK] Available Connected Evolution Integrations:`, integrations.map(i => i.name));

            const integration = integrations.find((i: any) => {
                const config = i.config as any;
                const matchesConfig = config?.instanceName === instanceName;
                const matchesName = i.name.toLowerCase().replace(/[^a-z0-9]/g, '') === instanceName.toLowerCase().replace(/[^a-z0-9]/g, '');
                return matchesConfig || matchesName;
            });

            if (!integration) {
                console.warn(`[WEBHOOK] ❌ No Integration found matching instance: "${instanceName}"`);
                try {
                    const fs = await import('fs');
                    fs.appendFileSync('webhook_hits.log', `[${new Date().toISOString()}] NO MATCH Found for Evolution instance: "${instanceName}". Body: ${JSON.stringify(body)}\n`);
                } catch(e){}
                return reply.send({ status: 'error', message: 'Integration not found' });
            }

            console.log(`[WEBHOOK] ✅ Matched Integration: ${integration.name} (Agent: ${integration.agent?.name || 'none'})`);

            if (remoteJid) {
                const isNonIndividual = remoteJid.endsWith('@g.us') || 
                                       remoteJid.endsWith('@newsletter') || 
                                       remoteJid.endsWith('@broadcast');
                
                if (isNonIndividual) {
                    return reply.send({ status: 'ignored', reason: 'non_individual_jid' });
                }
            }

            const agent = integration.agent;

            // ... (Platform Detection Omitted) ...
            let platform: 'WHATSAPP' | 'INSTAGRAM' = 'INSTAGRAM'; 
            if (remoteJid.includes('@s.whatsapp.net') || remoteJid.includes('@g.us') || remoteJid.includes('@broadcast') || remoteJid.includes('@lid')) {
                platform = 'WHATSAPP';
            } else {
                platform = 'INSTAGRAM';
            }

            // Extract phone using remoteJidAlt (priority) or remoteJid (fallback)
            const phone = extractPhoneFromJid(remoteJid, remoteJidAlt);
            const platformId = remoteJidAlt || remoteJid; 
            
            // Try to find by PlatformId (Specific) OR by Phone (Broad) to prevent dupes
            let contact = await prisma.contact.findFirst({
                where: { 
                    OR: [
                        { platformId: platformId },
                        { platformId: remoteJid }, 
                        { phone: phone } 
                    ],
                    platform: platform 
                }
            });

            if (!contact) {
                // If message is FROM ME, and contact doesn't exist, we usually don't want to create a contact for "Myself" if the logic expects contact to be the "Other".
                // HOWEVER, in WhatsApp, the contact is the Person I am talking TO.
                // Wait. remoteJid is ALWAYS the other person/group? 
                // NO. In "messages.upsert", `key.remoteJid` is the chat ID.
                // If I send a message TO someone, remoteJid is THEIR JID.
                // If they send a message to ME, remoteJid is THEIR JID (in direct chat).
                // So remoteJid is always the "Other Party" (or Group).
                // CORRECT.

                let contactName = messageData.pushName || phone;
                contact = await prisma.contact.create({
                    data: {
                        name: contactName,
                        phone: phone,           
                        platform: platform,     
                        platformId: platformId 
                    }
                });
                
                // 📞 DEBUG: Log phone format for NEW contact
                console.log('📞 DEBUG PHONE FORMAT (NEW CONTACT):');
                console.log('  contact.phone:', contact.phone);
                console.log('  contact.platformId:', contact.platformId);
                console.log('  extracted phone:', phone);
                console.log('  remoteJid:', remoteJid);
                console.log('  remoteJidAlt:', remoteJidAlt);
            } else {
                // Update contact logic (Omitted for brevity - assuming kept)
                const needsUpdate = (remoteJidAlt && contact.platformId !== platformId) || (contact.phone !== phone && phone.startsWith('55'));
                if (needsUpdate) {
                     await prisma.contact.update({ where: { id: contact.id }, data: { platformId: platformId, phone: phone } });
                }
                
                // 📞 DEBUG: Log phone format for EXISTING contact
                console.log('📞 DEBUG PHONE FORMAT (EXISTING CONTACT):');
                console.log('  contact.phone:', contact.phone);
                console.log('  contact.platformId:', contact.platformId);
                console.log('  extracted phone:', phone);
                console.log('  remoteJid:', remoteJid);
                console.log('  remoteJidAlt:', remoteJidAlt);
            }

            let conversation = await prisma.conversation.findFirst({
                where: {
                    contactId: contact.id,
                    integrationId: integration.id, 
                    status: 'OPEN'
                },
                orderBy: { updatedAt: 'desc' }
            });

            if (conversation && conversation.agentId !== integration.agentId) {
                 await prisma.conversation.update({
                     where: { id: conversation.id },
                     data: { agentId: integration.agentId }
                 });
            }

            if (!conversation) {
                 try {
                    conversation = await prisma.conversation.create({
                        data: {
                            contactId: contact.id,
                            agentId: integration.agentId,
                            integrationId: integration.id,
                            platform: platform, 
                            status: 'OPEN'
                        }
                    });
                 } catch (e) {
                      // Retry logic mostly
                      conversation = await prisma.conversation.findFirst({ where: { contactId: contact.id, status: 'OPEN' } }) as any;
                 }
            }
            
            if (!conversation) return reply.code(500).send({error: 'Failed to get conversation'});

            // 3. Save Message (USER or AGENT)
            const savedMessage = await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    text: caption || text || '',
                    sender: senderType, // 'USER' or 'AGENT'
                    userId: undefined,
                    mediaType: mediaType,
                    mediaUrl: mediaUrl,
                    mediaFilename: mediaFilename,
                    mediaSize: mediaSize,
                    mediaMimeType: mediaMimeType
                }
            });

            // BROADCAST Message via WebSocket & SSE
            console.log(`[WEBHOOK] Broadcasting ${senderType} Message...`);
            
            const broadcastData = {
                type: 'new_message',
                message: {
                    ...savedMessage,
                    integrationId: conversation.integrationId
                },
                conversationId: conversation.id,
                integrationId: conversation.integrationId
            };

            connectionManager.broadcast(broadcastData);
            import('../routes/sse.routes.js').then(({ broadcastSSE }) => {
                broadcastSSE(broadcastData);
            });

            // STOP HERE if it was sent by me/agent
            if (senderType === 'AGENT') {
                return reply.send({ status: 'processed_agent_message' });
            }

            // 4. Generate AI Response (ONLY IF SENDER IS USER)
            // ... (Rest of AI Logic) ...
            let finalText = null;

            if (agent && agent.apiKey) {
            // ... (AI Generation Logic) ...
                const agentKey = agent.apiKey;

                // Define Tools based on Skills
                const tools = [];
                if (agent.skills.includes('REAL_ESTATE')) {
                    tools.push(TOOLS.searchProperties);
                }

                let responseData = await llmService.generateResponse({
                    provider: agent.provider,
                    model: agent.model,
                    systemPrompt: `${agent.prompt}\n\n[SYSTEM: Keep it short.]`,
                    userMessage: text,
                    temperature: agent.temperature,
                    maxTokens: agent.maxTokens,
                    tools
                }, agentKey || undefined);

                finalText = responseData.text;

                // Handle Tool Calls
                if (responseData.toolCalls && responseData.toolCalls.length > 0) {
                    console.log('[WEBHOOK] Tool Calls detected:', responseData.toolCalls);
                    
                    for (const tool of responseData.toolCalls) {
                        if (tool.name === 'searchProperties') {
                            // 1. Execute Search
                            const filters: any = { status: 'AVAILABLE' };
                            if (tool.args.city) filters.city = { contains: tool.args.city, mode: 'insensitive' };
                            if (tool.args.type) filters.type = { equals: tool.args.type, mode: 'insensitive' }; // Fixed prisma filter
                            if (tool.args.maxPrice) filters.price = { lte: parseFloat(tool.args.maxPrice.toString()) };
                            if (tool.args.bedrooms) filters.bedrooms = { gte: parseInt(tool.args.bedrooms.toString()) };

                            const properties = await prisma.property.findMany({ 
                                where: filters,
                                take: 3
                            });

                            console.log(`[WEBHOOK] Found ${properties.length} properties`);

                            // 2. Send Media (Photos)
                             const { instanceUrl, apiKey } = await getEvolutionConfig(integration);
                             if (instanceUrl && apiKey) {
                                 const evolution = new EvolutionService(instanceUrl, apiKey);
                                 for (const prop of properties) {
                                     if (prop.images && prop.images.length > 0) {
                                         await evolution.sendText(instanceName, remoteJid, `🏠 *${prop.title}*\n💰 ${prop.price}\n📍 ${prop.city}`, apiKey);
                                         await evolution.sendMedia(instanceName, remoteJid, {
                                             type: 'image',
                                             url: prop.images[0],
                                             caption: `Mais detalhes: ${prop.code}`
                                         }, apiKey);
                                     }
                                 }
                             }

                            // 3. Update Conversation with Tool Output (For the second LLM pass)
                            const toolOutput = JSON.stringify(properties.map(p => ({ title: p.title, price: p.price, city: p.city })));
                            
                            const followUp = await llmService.generateResponse({
                                 provider: agent.provider,
                                 model: agent.model,
                                 systemPrompt: agent.prompt,
                                 userMessage: `User asked: "${text}". tool "searchProperties" returned: ${toolOutput}. Write a short friendly response inviting to visit.`,
                                 temperature: 0.7
                            }, agentKey || undefined);
                            
                            finalText = followUp.text;
                        }
                    }
                }
                
                console.log(`[WEBHOOK] AI Response: ${finalText}`);
            } else {
                console.log('[WEBHOOK] Skipping AI generation (No Agent Linked)');
            }

            // 5. Send Response via Evolution
            const { instanceUrl, apiKey } = await getEvolutionConfig(integration);
            
            if (instanceUrl && apiKey && finalText) {
                const evolution = new EvolutionService(instanceUrl, apiKey);
                try {
                    await evolution.sendText(instanceName, remoteJid, finalText, apiKey);
                    
                    const agentMessage = await prisma.message.create({
                        data: {
                            conversationId: conversation.id,
                            text: finalText,
                            sender: 'AGENT'
                        }
                    });

                    // BROADCAST Agent Message via WebSocket & SSE
                    console.log('[WEBHOOK] Broadcasting Agent Message...');
                    
                    const agentBroadcastData = {
                        type: 'new_message',
                        message: {
                            ...agentMessage,
                            integrationId: conversation.integrationId
                        },
                        conversationId: conversation.id,
                        integrationId: conversation.integrationId
                    };

                    // WebSocket
                    connectionManager.broadcast(agentBroadcastData);

                    // SSE
                    import('../routes/sse.routes.js').then(({ broadcastSSE }) => {
                        broadcastSSE(agentBroadcastData);
                    });

                } catch (sendError: any) {
                    console.error('[WEBHOOK] Failed to send response:', sendError.message);
                }
            }

            return reply.send({ status: 'processed' });

        } catch (error: any) {
            console.error('[WEBHOOK] Error processing message:', error);
            const fs = await import('fs');
            fs.appendFileSync('webhook_error.log', `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n`);
            return reply.code(500).send({ error: 'Internal processing error' });
        }
    }

    // Register Webhook Routes
    // Standard Route
    fastify.post('/evolution', handleEvolutionWebhook);
    
    // Wildcard Route (Handle /evolution/instance_name etc)
    fastify.post('/evolution/*', handleEvolutionWebhook); // For when 'Webhook by Events' is weird

}
