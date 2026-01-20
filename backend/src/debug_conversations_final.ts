
import { prisma } from './lib/prisma';

async function main() {
  console.log('--- INTEGRATIONS ---');
  const integrations = await prisma.integration.findMany();
  integrations.forEach(i => {
    console.log(`[${i.type}] Name: ${i.name} | ID: ${i.id}`);
  });

  console.log('\n--- CONVERSATIONS ---');
  const conversations = await prisma.conversation.findMany({
      include: {
          contact: true,
          agent: true
      }
  });
  
  conversations.forEach(c => {
    console.log(`ID: ${c.id}`);
    console.log(`   Contact: ${c.contact.name} (${c.contact.phone})`);
    console.log(`   IntegrationID: ${c.integrationId}`);
    console.log(`   AssignedTo: ${c.assignedToId}`);
    console.log(`   Status: ${c.status}`);
    console.log(`   Platform: ${c.platform}`);
    console.log('------------------------------------------------');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
