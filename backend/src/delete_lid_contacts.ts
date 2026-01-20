import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteLidContacts() {
    console.log('🗑️  Deletando contatos com @lid...\n');

    try {
        // Buscar contatos com @lid
        const contacts = await prisma.contact.findMany({
            where: {
                platformId: { endsWith: '@lid' },
                platform: 'WHATSAPP'
            },
            include: {
                conversations: {
                    include: {
                        messages: true
                    }
                }
            }
        });

        console.log(`📊 Total de contatos a deletar: ${contacts.length}\n`);

        for (const contact of contacts) {
            console.log(`🗑️  Deletando: ${contact.name}`);
            console.log(`   Conversas: ${contact.conversations.length}`);
            
            let totalMessages = 0;
            for (const conv of contact.conversations) {
                totalMessages += conv.messages.length;
                
                // Deletar mensagens
                await prisma.message.deleteMany({
                    where: { conversationId: conv.id }
                });
                
                // Deletar conversa
                await prisma.conversation.delete({
                    where: { id: conv.id }
                });
            }
            
            console.log(`   Mensagens deletadas: ${totalMessages}`);
            
            // Deletar contato
            await prisma.contact.delete({
                where: { id: contact.id }
            });
            
            console.log(`   ✅ Contato deletado!\n`);
        }

        console.log('✅ Limpeza concluída!');
        console.log('💡 Quando uma nova mensagem chegar, o contato será recriado com número correto.');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteLidContacts();
