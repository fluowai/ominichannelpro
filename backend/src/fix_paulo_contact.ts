import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPauloContact() {
    console.log('🔧 Corrigindo contato ~Paulo...\n');

    try {
        // Atualizar o contato específico
        const updated = await prisma.contact.update({
            where: {
                id: 'cmkbpq9q00000uhcov1btw0jz' // ID do contato ~Paulo
            },
            data: {
                phone: '5548988003260',  // Telefone correto
                platformId: '5548988003260@s.whatsapp.net'  // PlatformId correto
            }
        });

        console.log('✅ Contato atualizado com sucesso!');
        console.log(`   Nome: ${updated.name}`);
        console.log(`   Telefone: ${updated.phone}`);
        console.log(`   PlatformId: ${updated.platformId}\n`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixPauloContact();
