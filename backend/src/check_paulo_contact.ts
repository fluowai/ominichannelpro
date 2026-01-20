import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPauloContact() {
    console.log('🔍 Buscando contato ~Paulo...\n');

    try {
        // Buscar contato com nome Paulo ou número específico
        const contacts = await prisma.contact.findMany({
            where: {
                OR: [
                    { name: { contains: 'Paulo' } },
                    { phone: { contains: '104565810663442' } },
                    { phone: { contains: '5548988003260' } },
                    { platformId: { contains: '104565810663442' } },
                    { platformId: { contains: '5548988003260' } }
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

checkPauloContact();
