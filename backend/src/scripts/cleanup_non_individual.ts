import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('[CLEANUP] Starting hard deletion of non-individual contacts (Groups, Channels, Stories)...');
    
    // Find all contacts that have newsletter, group, or broadcast JIDs
    const contactsToDelete = await prisma.contact.findMany({
        where: {
            OR: [
                { platformId: { contains: '@newsletter' } },
                { platformId: { contains: '@g.us' } },
                { platformId: { contains: '@broadcast' } }
            ]
        },
        select: { id: true, platformId: true, name: true }
    });

    console.log(`[CLEANUP] Found ${contactsToDelete.length} records to remove.`);

    let count = 0;
    for (const contact of contactsToDelete) {
        try {
            console.log(`[CLEANUP] Removing ${contact.platformId} (${contact.name})...`);
            await prisma.contact.delete({
                where: { id: contact.id }
            });
            count++;
        } catch (e: any) {
            console.error(`[CLEANUP] Failed to remove ${contact.platformId}:`, e.message);
        }
    }

    console.log(`[CLEANUP] Finished. Removed ${count} contacts.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
