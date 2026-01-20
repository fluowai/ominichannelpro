
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGroq() {
  const settings = await prisma.systemSettings.findUnique({ where: { key: 'groq_key' } });
  const apiKey = settings?.value as string;

  if (!apiKey) { console.log('No Groq Key'); return; }

  console.log('Testing Groq with simple prompt...');
  
  try {
      const { data } = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 50
      }, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      console.log('SUCCESS:', data.choices[0].message.content);
  } catch (e: any) {
      console.error('FAIL:', e.response?.data || e.message);
  }
}

testGroq();
