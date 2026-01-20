import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const CONVERSATION_ID = 'cmkljia3900044licxgamu1mo'; 

async function simulateUiSend() {
  console.log(`--- SIMULATING UI SEND ---`);
  const prisma = new PrismaClient();
  
  try {
     const convo = await prisma.conversation.findUnique({
         where: { id: CONVERSATION_ID },
         include: { integration: true, contact: true }
     });

     if (!convo || !convo.integration) {
         console.error('Conversation not found');
         return;
     }

     const { WuzapiService } = await import('../services/wuzapi.service.js');
     const config = convo.integration.config as any;
     const wuzapi = new WuzapiService(convo.integration.instanceUrl!, config.userToken);
     
     const target = convo.contact.platformId || convo.contact.phone;
     const sessionId = config.sessionId;

     console.log(`Attempting send to ${target} via ${sessionId} at ${convo.integration.instanceUrl}`);
     const result = await wuzapi.sendText(sessionId, target, 'Teste Simulado 4 - ' + new Date().toISOString());
     console.log('Result:', JSON.stringify(result, null, 2));

  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simulateUiSend();
