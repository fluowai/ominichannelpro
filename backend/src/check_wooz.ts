import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWoozContact() {
    console.log('🔍 Buscando contato Wooz - Comercial...\n');

    try {
        const contacts = await prisma.contact.findMany({
            where: {
                OR: [
                    { name: { contains: 'Wooz' } },
                    { phone: { contains: '26546413532334' } },
                    { phone: { contains: '5546413532334' } }
                ],
                platform: 'WHATSAPP'
            }
        });

        console.log(`📊 Encontrados ${contacts.length} contatos:\n`);

        for (const contact of contacts) {
            console.log(`👤 ${contact.name}`);
            console.log(`   ID: ${contact.id}`);
            console.log(`   Telefone: ${contact.phone}`);
            console.log(`   PlatformId: ${contact.platformId}`);
            console.log(`   Criado em: ${contact.createdAt}\n`);
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkWoozContact();
