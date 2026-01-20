import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('[DEBUG] Checking message metadata for group indicators...');
    
    const messages = await prisma.message.findMany({
        where: {
            conversation: {
                status: 'OPEN'
            }
        },
        take: 50,
        include: {
            conversation: {
                include: {
                    contact: true
                }
            }
        }
    });

    for (const msg of messages) {
        console.log(`Msg from ${msg.conversation.contact.name}: ${msg.text.substring(0, 30)}...`);
        console.log(`Metadata: ${JSON.stringify(msg.metadata)}`);
        // console.log(`Attachments: ${JSON.stringify(msg.attachments)}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
