import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Set teste2 organizationId to null using ID
  const result = await prisma.integration.update({
    where: { id: 'cmkadmjn10001fx94tdjm6riz' },
    data: { organizationId: null }
  });

  console.log('Updated teste2:', result);
  
  // Verify all integrations
  const all = await prisma.integration.findMany({
    select: { name: true, organizationId: true }
  });
  console.log('\nAll integrations:', all);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
