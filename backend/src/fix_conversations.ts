
import { prisma } from './lib/prisma';

async function main() {
  const targetIntegrationId = 'cmkadmjn10001fx94tdjm6riz'; // ID of teste2

  console.log(`Updating conversations with null integrationId to ${targetIntegrationId}...`);
  
  const result = await prisma.conversation.updateMany({
    where: {
      integrationId: null
    },
    data: {
      integrationId: targetIntegrationId
    }
  });

  console.log(`Updated ${result.count} conversations.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
