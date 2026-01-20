import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para deletar conversa e contato específico
 * Executa: npx tsx src/scripts/delete_paulo_contact.ts
 */
async function deletePauloContact() {
    console.log('[DELETE] Starting deletion...');
    
    try {
        // Find contact with the @lid phone
        const contact = await prisma.contact.findFirst({
            where: {
                OR: [
                    { phone: '104565810663442' },
                    { platformId: { contains: '104565810663442' } }
                ]
            },
            include: {
                conversations: {
                    include: {
                        messages: true
                    }
                }
            }
        });

        if (!contact) {
            console.log('[DELETE] ❌ Contact not found');
            return;
        }

        console.log(`[DELETE] Found contact: ${contact.name}`);
        console.log(`[DELETE]   Phone: ${contact.phone}`);
        console.log(`[DELETE]   PlatformId: ${contact.platformId}`);
        console.log(`[DELETE]   Conversations: ${contact.conversations.length}`);

        // Delete all messages first
        for (const conv of contact.conversations) {
            console.log(`[DELETE] Deleting ${conv.messages.length} messages from conversation ${conv.id}...`);
            await prisma.message.deleteMany({
                where: { conversationId: conv.id }
            });
        }

        // Delete conversations
        console.log(`[DELETE] Deleting ${contact.conversations.length} conversations...`);
        await prisma.conversation.deleteMany({
            where: { contactId: contact.id }
        });

        // Delete contact
        console.log(`[DELETE] Deleting contact...`);
        await prisma.contact.delete({
            where: { id: contact.id }
        });

        console.log('[DELETE] ✅ Successfully deleted contact and all related data!');
        console.log('[DELETE] 📱 Now send a new message from Paulo to recreate with correct phone number.');
    } catch (error) {
        console.error('[DELETE] ❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

deletePauloContact();
