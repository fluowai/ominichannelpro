import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    console.log('[DEBUG] Exporting open conversations to debug_conversations.json...');
    
    const conversations = await prisma.conversation.findMany({
        where: { status: 'OPEN' },
        include: {
            contact: true,
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    const data = conversations.map(c => ({
        id: c.id,
        contact: {
            id: c.contact.id,
            name: c.contact.name,
            platformId: c.contact.platformId,
            phone: c.contact.phone,
            platform: c.contact.platform
        },
        lastMessage: c.messages[0]?.text || 'No message'
    }));

    fs.writeFileSync('debug_conversations.json', JSON.stringify(data, null, 2));
    console.log(`[DEBUG] Exported ${data.length} conversations.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
