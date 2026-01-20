import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { llmService } from '../services/llm.service.js';

import { TOOLS } from '../config/tools.js';

export async function aiRoutes(fastify: FastifyInstance) {
  
  // Test/Playground Endpoint
  fastify.post('/chat', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    try {
      const bodySchema = z.object({
        provider: z.enum(['GEMINI', 'OPENAI', 'GROQ']),
        model: z.string(),
        systemPrompt: z.string(),
        message: z.string(),
        temperature: z.number().optional(),
        maxTokens: z.number().optional(),
      });

      const { provider, model, systemPrompt, message, temperature, maxTokens, agentId } = bodySchema.extend({
        agentId: z.string().optional()
      }).parse(request.body);

      console.log(`[AI] Generating response with ${provider}/${model}`);

      let agentApiKey = undefined;
      let tools: any[] = [];

      if (agentId) {
          const agent = await prisma.agent.findUnique({ where: { id: agentId } });
          console.log(`[AI] Agent ID: ${agentId}, Found: ${!!agent}, Has Key: ${!!agent?.apiKey}`);
          
          if (agent) {
              if (agent.apiKey) agentApiKey = agent.apiKey;
              if (agent.skills && agent.skills.includes('REAL_ESTATE')) {
                  tools.push(TOOLS.searchProperties);
              }
          }
      }
      
      console.log(`[AI] Using Agent Specific Key: ${!!agentApiKey}`);
      console.log(`[AI] Tools injected: ${tools.length}`);

      const response = await llmService.generateResponse({
        provider,
        model,
        systemPrompt,
        userMessage: message,
        temperature,
        maxTokens,
        tools
      }, agentApiKey);

      let finalText = response.text;

      // Handle Tool Calls (Backend Execution)
      if (response.toolCalls && response.toolCalls.length > 0) {
          console.log('[AI] Tool Calls detected:', response.toolCalls);
          
          for (const tool of response.toolCalls) {
              if (tool.name === 'searchProperties') {
                  const filters: any = { status: 'AVAILABLE' };
                  if (tool.args.city) filters.city = { contains: tool.args.city, mode: 'insensitive' };
                  if (tool.args.type) filters.type = tool.args.type;
                  if (tool.args.maxPrice) filters.price = { lte: parseFloat(tool.args.maxPrice.toString()) };
                  if (tool.args.bedrooms) filters.bedrooms = { gte: parseInt(tool.args.bedrooms.toString()) };

                  const properties = await prisma.property.findMany({ 
                      where: filters,
                      take: 3
                  });
                  
                  const toolOutput = JSON.stringify(properties.map(p => ({ 
                      title: p.title, 
                      price: p.price, 
                      city: p.city,
                      type: p.type,
                      code: p.code,
                      images: p.images
                  })));

                  const followUp = await llmService.generateResponse({
                       provider,
                       model,
                       systemPrompt,
                       userMessage: `User asked: "${message}". tool "searchProperties" returned: ${toolOutput}. Write a friendly response summarizing the options found. If specific properties are returned, you MUST include their photos using markdown syntax like: ![Title](image_url).`,
                       temperature: 0.7
                  }, agentApiKey);
                  
                  finalText = followUp.text;
              }
          }
      }

      return reply.send({ response: finalText });

    } catch (error: any) {
      console.error('AI Route Error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: error.message || 'Internal server error' });
    }
  });
}
