import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('[DELETE] Starting hard deletion of groups and channels...');
    
    // Find all contacts that have newsletter or group JIDs
    const contactsToDelete = await prisma.contact.findMany({
        where: {
            OR: [
                { platformId: { contains: '@newsletter' } },
                { platformId: { contains: '@g.us' } }
            ]
        },
        select: { id: true, platformId: true, name: true }
    });

    console.log(`[DELETE] Found ${contactsToDelete.length} records to remove.`);

    for (const contact of contactsToDelete) {
        try {
            console.log(`[DELETE] Removing ${contact.platformId} (${contact.name})...`);
            await prisma.contact.delete({
                where: { id: contact.id }
            });
        } catch (e: any) {
            console.error(`[DELETE] Failed to remove ${contact.platformId}:`, e.message);
        }
    }

    // Also double check Conversations that might have been miscategorized and not linked to a group-contact but have a group platformId if applicable
    // Usually Conversation.platform is WHATSAPP or INSTAGRAM, but the platformId of the contact is the key.
    // If we already deleted the contact, their conversation is gone due to Cascade.

    console.log('[DELETE] Finished.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
