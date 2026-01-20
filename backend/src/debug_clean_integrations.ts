
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [] // Disable logging
});

async function main() {
  const integrations = await prisma.integration.findMany({
      select: {
          id: true,
          name: true,
          config: true,
          agentId: true
      }
  });
  console.log(JSON.stringify(integrations, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
