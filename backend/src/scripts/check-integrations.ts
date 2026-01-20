import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkIntegrations() {
  console.log('--- INTEGRATIONS STATUS ---');
  try {
    const integrations = await prisma.integration.findMany({
      include: {
        agent: {
          select: {
            name: true
          }
        }
      }
    });

    if (integrations.length === 0) {
      console.log('No integrations found.');
    }

    for (const integration of integrations) {
      const config = integration.config as any;
      console.log(`\nID: ${integration.id}`);
      console.log(`Name: ${integration.name}`);
      console.log(`Type: ${integration.type}`);
      console.log(`Status: ${integration.status}`);
      console.log(`Instance: ${integration.instanceUrl}`);
      console.log(`Session ID: ${config?.sessionId || 'undefined'}`);
      console.log(`Agent: ${integration.agent?.name || 'N/A'}`);
      
      console.log(`Config: ${JSON.stringify(config, null, 2)}`);
    console.log('\n--- SYSTEM SETTINGS ---');
    const settings = await prisma.systemSettings.findMany();
    console.log(JSON.stringify(settings, null, 2));

  } catch (error) {
    console.error('Error checking integrations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIntegrations();
