import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

const envPath = 'c:/Users/paulo/OneDrive/Área de Trabalho/FLUOW AI2026/backend/.env';
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

async function checkEverything() {
  console.log('--- SYSTEM STATUS REPORT ---');
  const dbUrl = process.env.DATABASE_URL || '';
  console.log('DATABASE_URL present:', !!dbUrl);
  if (dbUrl) {
      console.log('DATABASE_URL starts with:', dbUrl.substring(0, 20) + '...');
  }
  
  const prisma = new PrismaClient();
  
  try {
    const integrations = await prisma.integration.findMany({
      include: {
        agent: {
          select: { name: true }
        }
      }
    });

    console.log(`\nFound ${integrations.length} Integrations:`);
    for (const integration of integrations) {
      console.log(`- [${integration.type}] ${integration.name} (Status: ${integration.status})`);
      if (integration.type === 'EVOLUTION_API') {
          console.log(`  Config: ${JSON.stringify(integration.config)}`);
      }
    }

    const contactCount = await prisma.contact.count();
    const convoCount = await prisma.conversation.count();
    const messageCount = await prisma.message.count();
    
    console.log(`\nDatabase Stats:`);
    console.log(`- Contacts: ${contactCount}`);
    console.log(`- Conversations: ${convoCount}`);
    console.log(`- Messages: ${messageCount}`);

    const lastMessages = await prisma.message.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            conversation: {
                include: {
                    integration: true
                }
            }
        }
    });

    console.log(`\nLast 5 Messages:`);
    for (const m of lastMessages) {
        console.log(`- [${m.createdAt.toISOString()}] ${m.sender} in ${m.conversation.integration?.name || 'Unknown'}: ${m.text?.substring(0, 30)}`);
    }

  } catch (error: any) {
    console.error('Error during check:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEverything();
