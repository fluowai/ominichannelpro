import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const integrations = await prisma.integration.findMany({
    select: {
      id: true,
      name: true,
      organizationId: true,
    }
  });

  console.log('Integrations:', JSON.stringify(integrations, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
