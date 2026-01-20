import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicateConversations() {
    console.log('🔧 Removendo conversas duplicadas...\n');

    try {
        // Buscar todas as conversas
        const conversations = await prisma.conversation.findMany({
            include: {
                contact: true,
                messages: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        console.log(`📊 Total de conversas: ${conversations.length}\n`);

        // Agrupar por contactId
        const grouped = conversations.reduce((acc: any, conv) => {
            const key = conv.contactId;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(conv);
            return acc;
        }, {});

        let removed = 0;
        let kept = 0;

        // Para cada grupo com duplicatas
        for (const [contactId, convs] of Object.entries(grouped) as any) {
            if (convs.length > 1) {
                console.log(`\n🔍 Processando duplicatas para: ${convs[0].contact?.name || contactId}`);
                console.log(`   Total de conversas: ${convs.length}`);

                // Ordenar por updatedAt (mais recente primeiro)
                convs.sort((a: any, b: any) => 
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );

                // Manter a primeira (mais recente)
                const toKeep = convs[0];
                console.log(`   ✅ Mantendo: ${toKeep.id} (${toKeep.messages.length} mensagens, atualizada: ${toKeep.updatedAt})`);
                kept++;

                // Remover as outras
                for (let i = 1; i < convs.length; i++) {
                    const toDelete = convs[i];
                    console.log(`   ❌ Removendo: ${toDelete.id} (${toDelete.messages.length} mensagens, atualizada: ${toDelete.updatedAt})`);
                    
                    // Deletar mensagens primeiro
                    await prisma.message.deleteMany({
                        where: { conversationId: toDelete.id }
                    });

                    // Deletar conversa
                    await prisma.conversation.delete({
                        where: { id: toDelete.id }
                    });

                    removed++;
                }
            }
        }

        console.log('\n✅ Limpeza concluída!');
        console.log(`📊 Estatísticas:`);
        console.log(`   - Conversas mantidas: ${kept}`);
        console.log(`   - Conversas removidas: ${removed}`);
        console.log(`   - Total final: ${conversations.length - removed}`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

removeDuplicateConversations();
