import axios from 'axios';
import { prisma } from '../lib/prisma.js';

interface LLMConfig {
  provider: 'GEMINI' | 'OPENAI' | 'GROQ';
  model: string;
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
}

export class LLMService {
  
  private async getKeys() {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: { in: ['gemini_key', 'openai_key', 'groq_key'] }
      }
    });

    return settings.reduce((acc: Record<string, string>, curr: any) => {
      acc[curr.key] = curr.value as string;
      return acc;
    }, {} as Record<string, string>);
  }

  async generateResponse(config: LLMConfig, agentApiKey?: string): Promise<CAAResponse> {
    const keys = await this.getKeys();
    
    // Priority: Agent Specific Key > Database Global Key > Environment Variable
    // DEBUG LOG
    console.log('[LLM] Solving Key Priority:');
    console.log(`- Agent Key Provided: ${!!agentApiKey}`);
    console.log(`- DB Global Key (Gemini): ${!!keys['gemini_key']}`);
    console.log(`- Env Key (Gemini): ${!!process.env.GEMINI_API_KEY}`);

    const apiKeys = {
      GEMINI: agentApiKey || keys['gemini_key'] || process.env.GEMINI_API_KEY,
      OPENAI: agentApiKey || keys['openai_key'] || process.env.OPENAI_API_KEY,
      GROQ: agentApiKey || keys['groq_key'] || process.env.GROQ_API_KEY,
    };

    switch (config.provider) {
      case 'GEMINI':
        return this.callGemini(config, apiKeys.GEMINI);
      case 'OPENAI':
        return this.callOpenAI(config, apiKeys.OPENAI);
      case 'GROQ':
        return this.callGroq(config, apiKeys.GROQ);
      default:
        throw new Error(`Provider ${config.provider} not supported`);
    }
  }

  private async callGemini(config: LLMConfig, apiKey?: string): Promise<CAAResponse> {
    if (!apiKey) throw new Error('Gemini API Key not configured');

    try {
      // Use official SDK dynamically imported to avoid startup errors if not installed
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Add tools if provided
      const modelConfig: any = { 
        model: config.model,
        generationConfig: {
            temperature: config.temperature ?? 0.7,
            maxOutputTokens: config.maxTokens ?? 1000,
        }
      };

      if (config.tools && config.tools.length > 0) {
          // Gemini format: { function_declarations: [...] } inside "tools"
          // We need to map OpenAI-style tools to Gemini if needed, or assume standard format
          // For simplicity, let's assume we pass standard definition and map it
           modelConfig.tools = [{
                functionDeclarations: config.tools.map(t => t.function)
           }];
      }

      const model = genAI.getGenerativeModel(modelConfig);

      const chatSession = model.startChat({
        history: [
            {
                role: 'user',
                parts: [{ text: config.systemPrompt }] 
            },
            {
                role: 'model',
                parts: [{ text: 'OK.' }]
            }
        ]
      });

      const result = await chatSession.sendMessage(config.userMessage);
      const response = result.response;
      const text = response.text();
      
      // Check for function calls
      const functionCalls = response.functionCalls();
      const toolCalls = functionCalls ? functionCalls.map((fc: any) => ({
          name: fc.name,
          args: fc.args
      })) : undefined;

      return { text, toolCalls };

    } catch (error: any) {
        console.error('Gemini SDK Error:', error);
        // Fallback to simple axios if SDK fails (or rate limit specific handling)
        if (error.message?.includes('429')) {
             throw new Error('Gemini Free Tier Rate Limit Exceeded. Please try again later or use a different key.');
        }
        throw new Error(`Gemini API Error: ${error.message}`);
    }
  }

  private async callOpenAI(config: LLMConfig, apiKey?: string) {
    if (!apiKey) throw new Error('OpenAI API Key not configured');

    try {
      const url = 'https://api.openai.com/v1/chat/completions';
    
    const body = {
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: config.userMessage }
      ],
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 1000,
    };

      const { data } = await axios.post(url, {
          ...body,
          tools: config.tools
      }, {
        headers: { /*...*/ 'Authorization': `Bearer ${apiKey}` /*...*/ }
      });
      
      const message = data.choices[0].message;
      return {
          text: message.content || '',
          toolCalls: message.tool_calls?.map((tc: any) => ({
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments)
          }))
      };
    } catch (error: any) {
        console.error('OpenAI Error:', error.response?.data || error.message);
        throw new Error(`OpenAI API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private async callGroq(config: LLMConfig, apiKey?: string) {
    if (!apiKey) throw new Error('Groq API Key not configured');

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    const body = {
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: config.userMessage }
      ],
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 1000,
    };

    try {
      const { data } = await axios.post(url, {
          ...body,
          tools: config.tools
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const message = data.choices[0].message;
      return {
          text: message.content || '',
          toolCalls: message.tool_calls?.map((tc: any) => ({
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments)
          }))
      };
    } catch (error: any) {
        console.error('Groq Error:', error.response?.data || error.message);
        throw new Error(`Groq API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

export const llmService = new LLMService();
