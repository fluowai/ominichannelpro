import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('[CLEANUP] Hard deleting all 16 reported conversations/contacts...');
    
    // Get all open conversations
    const conversations = await prisma.conversation.findMany({
      where: { status: 'OPEN' },
      select: { id: true, contactId: true }
    });

    console.log(`[CLEANUP] Found ${conversations.length} conversations to wipe.`);

    for (const conv of conversations) {
        try {
            console.log(`[CLEANUP] Removing conversation ${conv.id} and contact ${conv.contactId}...`);
            // Delete contact (Cascades to conversations and messages)
            await prisma.contact.delete({
                where: { id: conv.contactId }
            });
        } catch (e: any) {
            console.error(`[CLEANUP] Error removing ${conv.id}:`, e.message);
        }
    }

    console.log('[CLEANUP] Done.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
