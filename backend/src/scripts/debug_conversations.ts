import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('[DEBUG] Investigating the 16 remaining conversations...');
    
    const conversations = await prisma.conversation.findMany({
        where: { status: 'OPEN' }, // Assuming these are the ones shown
        include: {
            contact: true,
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    console.log(`[DEBUG] Found ${conversations.length} OPEN conversations.`);
    
    for (const conv of conversations) {
        const lastMsg = conv.messages[0]?.text || 'No message';
        console.log(`[CONV] ID: ${conv.id} | Contact: ${conv.contact.name} | JID: ${conv.contact.platformId} | LastMsg: ${lastMsg.substring(0, 50)}...`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
