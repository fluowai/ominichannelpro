import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOrphanedConversations() {
  console.log('=== FIXING ORPHANED CONVERSATIONS ===\n');

  // Find conversations without integrationId
  const orphaned = await prisma.conversation.findMany({
    where: { integrationId: null },
    include: { contact: true }
  });

  console.log(`Found ${orphaned.length} orphaned conversations\n`);

  if (orphaned.length === 0) {
    console.log('✅ No orphaned conversations found!');
    return;
  }

  // Try to assign them to an integration based on platform
  const integrations = await prisma.integration.findMany({
    where: { status: 'CONNECTED' }
  });

  console.log(`Available integrations: ${integrations.length}\n`);

  for (const conv of orphaned) {
    // Try to find matching integration by platform
    const matchingIntegration = integrations.find(int => 
      int.type === 'EVOLUTION_API' && conv.platform === 'WHATSAPP'
    );

    if (matchingIntegration) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { integrationId: matchingIntegration.id }
      });
      console.log(`✅ Fixed: ${conv.contact.name} -> ${matchingIntegration.name}`);
    } else {
      console.log(`⚠️  Could not fix: ${conv.contact.name} (no matching integration)`);
    }
  }

  console.log('\n=== FIX COMPLETE ===');
}

fixOrphanedConversations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
