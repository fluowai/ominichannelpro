
import { prisma } from './lib/prisma';

async function main() {
  const integrations = await prisma.integration.findMany();
  console.log('--- INTEGRATIONS ---');
  integrations.forEach(i => {
      console.log(`ID: ${i.id}`);
      console.log(`Name: ${i.name}`);
      console.log(`Type: ${i.type}`);
      console.log(`Config: ${JSON.stringify(i.config, null, 2)}`);
      console.log('-------------------');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
