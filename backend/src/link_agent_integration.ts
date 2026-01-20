
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const integrationId = 'cmkadmjn10001fx94tdjm6riz';
  const agentId = 'cmkae3m4n0001q59ixwf3d04t';

  await prisma.integration.update({
    where: { id: integrationId },
    data: { agentId }
  });

  console.log(`Linked Agent ${agentId} to Integration ${integrationId}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
