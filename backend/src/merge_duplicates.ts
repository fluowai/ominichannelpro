import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mergeContacts(phone: string) {
    console.log(`[MERGE] Looking for duplicates with phone: ${phone}`);
    
    // Find all contacts with this phone
    const contacts = await prisma.contact.findMany({
        where: { phone: phone },
        include: { conversations: true }
    });

    if (contacts.length <= 1) {
        console.log(`[MERGE] No duplicates found for ${phone}`);
        return;
    }

    // Keep the one categorized as WHATSAPP if possible, otherwise the oldest one
    const sorted = contacts.sort((a, b) => {
        if (a.platform === 'WHATSAPP' && b.platform !== 'WHATSAPP') return -1;
        if (b.platform === 'WHATSAPP' && a.platform !== 'WHATSAPP') return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const primary = sorted[0];
    const duplicates = sorted.slice(1);

    console.log(`[MERGE] Primary Contact: ${primary.id} (${primary.name} - ${primary.platform})`);

    for (const dup of duplicates) {
        console.log(`[MERGE] Merging Duplicate: ${dup.id} (${dup.name} - ${dup.platform})`);
        
        // Move all conversations to primary contact
        const conversations = await prisma.conversation.findMany({
            where: { contactId: dup.id }
        });

        for (const conv of conversations) {
            console.log(`[MERGE] Moving Conversation ${conv.id} to primary contact`);
            
            // Check if primary already has a conversation for this integration
            const existingConv = await prisma.conversation.findFirst({
                where: { 
                    contactId: primary.id,
                    integrationId: conv.integrationId,
                    status: 'OPEN'
                }
            });

            if (existingConv && conv.status === 'OPEN') {
                console.log(`[MERGE] Merging messages from ${conv.id} into existing open conversation ${existingConv.id}`);
                await prisma.message.updateMany({
                    where: { conversationId: conv.id },
                    data: { conversationId: existingConv.id }
                });
                // Delete the empty conversation
                await prisma.conversation.delete({ where: { id: conv.id } });
            } else {
                // Just reassign the conversation
                await prisma.conversation.update({
                    where: { id: conv.id },
                    data: { contactId: primary.id }
                });
            }
        }

        // Delete the duplicate contact
        await prisma.contact.delete({ where: { id: dup.id } });
    }

    console.log(`[MERGE] Successfully merged ${duplicates.length} duplicates for ${phone}`);
}

async function main() {
    // We know Paulo has duplicates
    await mergeContacts('554888003260');
    
    // Scan for any other duplicates automatically
    const duplicatePhones = await prisma.contact.groupBy({
        by: ['phone'],
        _count: { phone: true },
        having: { phone: { _count: { gt: 1 } } }
    });

    for (const d of duplicatePhones) {
        if (d.phone) await mergeContacts(d.phone);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
