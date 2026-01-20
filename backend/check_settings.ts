
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSettings.findUnique({ where: { key: 'evolution_api' } });
  console.log('--- EVOLUTION SETTINGS ---');
  console.log(JSON.stringify(settings, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
