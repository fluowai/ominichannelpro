import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllLidContacts() {
    console.log('🔍 Buscando contatos com @lid...\n');

    try {
        const contacts = await prisma.contact.findMany({
            where: {
                platformId: { endsWith: '@lid' },
                platform: 'WHATSAPP'
            }
        });

        console.log(`📊 Total de contatos com @lid: ${contacts.length}\n`);

        for (const contact of contacts) {
            console.log(`❌ ${contact.name}`);
            console.log(`   Telefone: ${contact.phone}`);
            console.log(`   PlatformId: ${contact.platformId}`);
            console.log(`   ⚠️  Este contato NÃO tem número real (apenas ID interno)\n`);
        }

        console.log('\n💡 Solução:');
        console.log('   Esses contatos foram criados antes da correção do webhook.');
        console.log('   O @lid não contém o número real do WhatsApp.');
        console.log('   Opções:');
        console.log('   1. Aguardar nova mensagem (webhook corrigido vai criar contato correto)');
        console.log('   2. Deletar esses contatos manualmente');
        console.log('   3. Atualizar manualmente com número correto se souber');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllLidContacts();
