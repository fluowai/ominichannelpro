import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function searchContact() {
  console.log('=== SEARCHING FOR CONTACT 9987 ===\n');

  // Search by name or phone containing 9987
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: '9987', mode: 'insensitive' } },
        { phone: { contains: '9987' } },
        { platformId: { contains: '9987' } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          integration: true
        }
      }
    }
  });

  console.log(`Found ${contacts.length} contacts matching "9987"\n`);

  for (const contact of contacts) {
    console.log(`Contact: ${contact.name}`);
    console.log(`  Phone: ${contact.phone}`);
    console.log(`  Platform: ${contact.platform}`);
    console.log(`  PlatformId: ${contact.platformId}`);
    console.log(`  Conversations: ${contact.conversations.length}`);
    
    for (const conv of contact.conversations) {
      console.log(`\n  Conversation ${conv.id}:`);
      console.log(`    Integration: ${conv.integration?.name || 'NONE'} (${conv.integrationId})`);
      console.log(`    Status: ${conv.status}`);
      console.log(`    Messages: ${conv.messages.length}`);
      
      conv.messages.forEach((msg, i) => {
        console.log(`      ${i + 1}. [${msg.sender}] ${msg.text.substring(0, 50)}... (${new Date(msg.createdAt).toLocaleString()})`);
      });
    }
    console.log('');
  }

  // Also check recent messages globally
  console.log('\n=== RECENT MESSAGES (Last 10) ===\n');
  const recentMessages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      conversation: {
        include: {
          contact: true,
          integration: true
        }
      }
    }
  });

  recentMessages.forEach((msg, i) => {
    console.log(`${i + 1}. ${msg.conversation.contact.name} (${msg.conversation.integration?.name || 'NO_INT'})`);
    console.log(`   [${msg.sender}] ${msg.text.substring(0, 60)}`);
    console.log(`   ${new Date(msg.createdAt).toLocaleString()}\n`);
  });
}

searchContact()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
