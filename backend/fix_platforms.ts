import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for misclassified conversations...\n');

  // Find all contacts and conversations
  const contacts = await prisma.contact.findMany({
    include: { conversations: true }
  });

  let fixedContacts = 0;
  let fixedConversations = 0;

  for (const contact of contacts) {
    const platformId = contact.platformId;
    let correctPlatform: 'WHATSAPP' | 'INSTAGRAM' = 'INSTAGRAM';

    // Detect correct platform based on platformId
    if (platformId.includes('@s.whatsapp.net') || 
        platformId.includes('@g.us') || 
        platformId.includes('@broadcast') ||
        platformId.includes('@lid')) {
      correctPlatform = 'WHATSAPP';
    }

    // Fix contact if wrong
    if (contact.platform !== correctPlatform) {
      console.log(`📝 Fixing Contact: ${contact.name}`);
      console.log(`   Old: ${contact.platform} → New: ${correctPlatform}`);
      console.log(`   PlatformID: ${platformId}\n`);

      await prisma.contact.update({
        where: { id: contact.id },
        data: { platform: correctPlatform }
      });
      fixedContacts++;
    }

    // Fix conversations if wrong
    for (const conv of contact.conversations) {
      if (conv.platform !== correctPlatform) {
        console.log(`💬 Fixing Conversation: ${conv.id}`);
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { platform: correctPlatform }
        });
        fixedConversations++;
      }
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Fixed ${fixedContacts} contacts`);
  console.log(`   Fixed ${fixedConversations} conversations`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
