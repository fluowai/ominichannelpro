import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('[DEBUG] Listing all contacts to identify remaining non-individual items...');
    
    const contacts = await prisma.contact.findMany({
        select: { id: true, platformId: true, name: true, phone: true, platform: true }
    });

    console.log(`[DEBUG] Total contacts: ${contacts.length}`);
    
    for (const contact of contacts) {
        console.log(`Contact: ${contact.name} | PlatformId: ${contact.platformId} | Phone: ${contact.phone} | Platform: ${contact.platform}`);
    }

    const conversations = await prisma.conversation.count();
    console.log(`[DEBUG] Total conversations: ${conversations}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
