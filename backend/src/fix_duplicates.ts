import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find duplicate conversations for the same contact
  const conversations = await prisma.conversation.findMany({
    include: {
      contact: true,
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Group by contactId
  const grouped = new Map<string, any[]>();
  
  for (const conv of conversations) {
    const key = conv.contactId;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(conv);
  }

  // Find duplicates
  let deletedCount = 0;
  for (const [contactId, convs] of grouped.entries()) {
    if (convs.length > 1) {
      console.log(`\nContact ${convs[0].contact.name} has ${convs.length} conversations`);
      
      // Keep the one with most recent activity
      const sorted = convs.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      const keep = sorted[0];
      const toDelete = sorted.slice(1);
      
      console.log(`  Keeping: ${keep.id} (updated: ${keep.updatedAt})`);
      
      for (const dup of toDelete) {
        console.log(`  Deleting: ${dup.id} (updated: ${dup.updatedAt})`);
        
        // Move messages to the kept conversation
        await prisma.message.updateMany({
          where: { conversationId: dup.id },
          data: { conversationId: keep.id }
        });
        
        // Delete the duplicate
        await prisma.conversation.delete({
          where: { id: dup.id }
        });
        
        deletedCount++;
      }
    }
  }

  console.log(`\n✅ Deleted ${deletedCount} duplicate conversations`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
