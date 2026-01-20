
import { prisma } from './src/lib/prisma';

async function checkIntegration() {
  const integrations = await prisma.integration.findMany({
      include: { agent: true }
  });
  console.log('Integrations:', JSON.stringify(integrations, null, 2));
}

checkIntegration();
