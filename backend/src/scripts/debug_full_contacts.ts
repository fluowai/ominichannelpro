import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    console.log('[DEBUG] Exporting full contact data for open conversations...');
    
    const conversations = await prisma.conversation.findMany({
        where: { status: 'OPEN' },
        include: {
            contact: true
        }
    });

    const data = conversations.map(c => ({
        id: c.id,
        contact: c.contact
    }));

    fs.writeFileSync('debug_full_contacts.json', JSON.stringify(data, null, 2));
    console.log(`[DEBUG] Exported ${data.length} contacts.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
