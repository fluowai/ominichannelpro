
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: [] });

async function main() {
  const agent = await prisma.agent.findFirst();
  console.log('--- AGENT ---');
  console.log(JSON.stringify(agent, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
