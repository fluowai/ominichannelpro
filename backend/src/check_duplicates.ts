import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicateConversations() {
    console.log('🔍 Verificando conversas duplicadas...\n');

    try {
        // Buscar todas as conversas
        const conversations = await prisma.conversation.findMany({
            include: {
                contact: true
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

        // Encontrar duplicatas
        let duplicates = 0;
        for (const [contactId, convs] of Object.entries(grouped) as any) {
            if (convs.length > 1) {
                duplicates++;
                console.log(`❌ DUPLICATA encontrada para contato: ${convs[0].contact?.name || contactId}`);
                console.log(`   Total de conversas: ${convs.length}`);
                for (const conv of convs) {
                    console.log(`   - ID: ${conv.id}, Status: ${conv.status}, Criado: ${conv.createdAt}`);
                }
                console.log('');
            }
        }

        if (duplicates === 0) {
            console.log('✅ Nenhuma duplicata encontrada no banco de dados!');
            console.log('   O problema pode estar no frontend (renderização duplicada)');
        } else {
            console.log(`\n📊 Total de contatos com duplicatas: ${duplicates}`);
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDuplicateConversations();
