
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Conversations ---');
  const conversations = await prisma.conversation.findMany({
      include: { 
          contact: true, 
          messages: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
  });

  if (conversations.length === 0) {
      console.log('NO CONVERSATIONS FOUND.');
  } else {
      conversations.forEach(c => {
          console.log(`\nID: ${c.id}`);
          console.log(`Contact: ${c.contact.name} (${c.contact.phone})`);
          console.log(`Integration ID from DB: ${(c as any).integrationId}`);
          console.log(`Messages: ${c.messages.length}`);
          c.messages.forEach(m => {
              console.log(` - [${m.sender}] ${m.text.substring(0, 50)}...`);
          });
      });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
