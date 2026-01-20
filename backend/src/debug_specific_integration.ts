
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: [] });

async function main() {
  const i = await prisma.integration.findUnique({
      where: { id: 'cmkadmjn10001fx94tdjm6riz' },
      select: { id: true, name: true, agentId: true, config: true }
  });
  console.log('--- TARGET ---');
  console.log(JSON.stringify(i, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
