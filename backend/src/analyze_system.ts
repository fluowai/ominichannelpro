import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeSystem() {
  console.log('=== SYSTEM ANALYSIS ===\n');

  // 1. Check Conversations
  const conversations = await prisma.conversation.findMany({
    include: {
      contact: true,
      integration: true,
      messages: { take: 1, orderBy: { createdAt: 'desc' } }
    }
  });

  console.log(`Total Conversations: ${conversations.length}`);
  
  // Group by integration
  const byIntegration = conversations.reduce((acc, conv) => {
    const key = conv.integrationId || 'NO_INTEGRATION';
    if (!acc[key]) acc[key] = [];
    acc[key].push(conv);
    return acc;
  }, {} as Record<string, any[]>);

  console.log('\nConversations by Integration:');
  for (const [intId, convs] of Object.entries(byIntegration)) {
    const integration = convs[0].integration;
    console.log(`  ${integration?.name || 'NO INTEGRATION'} (${intId}): ${convs.length} conversations`);
  }

  // 2. Check for orphaned conversations
  const orphaned = conversations.filter(c => !c.integrationId);
  if (orphaned.length > 0) {
    console.log(`\n⚠️  WARNING: ${orphaned.length} conversations without integrationId`);
    orphaned.forEach(c => {
      console.log(`    - ${c.id} (contact: ${c.contact.name})`);
    });
  }

  // 3. Check for duplicate contacts
  const contacts = await prisma.contact.findMany();
  const phoneMap = new Map<string, any[]>();
  
  contacts.forEach(c => {
    if (c.phone) {
      if (!phoneMap.has(c.phone)) phoneMap.set(c.phone, []);
      phoneMap.get(c.phone)!.push(c);
    }
  });

  const duplicates = Array.from(phoneMap.entries()).filter(([_, cs]) => cs.length > 1);
  if (duplicates.length > 0) {
    console.log(`\n⚠️  WARNING: ${duplicates.length} duplicate phone numbers`);
    duplicates.forEach(([phone, cs]) => {
      console.log(`    - ${phone}: ${cs.map(c => c.name).join(', ')}`);
    });
  }

  // 4. Check integrations
  const integrations = await prisma.integration.findMany();
  console.log(`\nTotal Integrations: ${integrations.length}`);
  integrations.forEach(int => {
    const convCount = conversations.filter(c => c.integrationId === int.id).length;
    console.log(`  - ${int.name} (${int.type}): ${convCount} conversations, status: ${int.status}`);
  });

  console.log('\n=== ANALYSIS COMPLETE ===');
}

analyzeSystem()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
