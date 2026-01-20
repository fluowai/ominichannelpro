
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const integration = await prisma.integration.findFirst({
        where: { name: 'teste2' }
    });

    if (!integration) {
        console.error('Integration teste2 not found');
        return;
    }

    const agent = await prisma.agent.findFirst();
    if (!agent) {
        console.error('No agents found');
        return;
    }

    await prisma.integration.update({
        where: { id: integration.id },
        data: { agentId: agent.id }
    });

    console.log(`✅ Success! Linked Agent ${agent.name} (${agent.id}) to integration ${integration.name}`);

  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
