
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Users ---');
  const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, organizationId: true }
  });
  console.table(users);

  console.log('\n--- Integrations ---');
  const integrations = await prisma.integration.findMany({
      select: { id: true, name: true, type: true, status: true, organizationId: true }
  });
  console.table(integrations);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
