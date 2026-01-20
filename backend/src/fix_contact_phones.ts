import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para corrigir telefones de contatos existentes
 * Extrai o número correto do platformId e atualiza o campo phone
 */

function extractPhoneFromPlatformId(platformId: string): string {
    // Remove sufixo (@s.whatsapp.net, @lid, @g.us)
    const phone = platformId.split('@')[0];
    
    // Remove caracteres não numéricos
    return phone.replace(/\D/g, '');
}

async function fixContactPhones() {
    console.log('🔧 Iniciando correção de telefones...\n');

    try {
        // Buscar todos os contatos do WhatsApp
        const contacts = await prisma.contact.findMany({
            where: {
                platform: 'WHATSAPP'
            }
        });

        console.log(`📊 Total de contatos encontrados: ${contacts.length}\n`);

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const contact of contacts) {
            try {
                // Extrai telefone do platformId
                const correctPhone = extractPhoneFromPlatformId(contact.platformId);
                
                // Verifica se o telefone atual está errado
                if (contact.phone !== correctPhone) {
                    console.log(`📞 Corrigindo contato: ${contact.name}`);
                    console.log(`   Antes: ${contact.phone}`);
                    console.log(`   Depois: ${correctPhone}`);
                    console.log(`   PlatformId: ${contact.platformId}\n`);

                    // Atualiza o contato
                    await prisma.contact.update({
                        where: { id: contact.id },
                        data: { phone: correctPhone }
                    });

                    updated++;
                } else {
                    skipped++;
                }
            } catch (error) {
                console.error(`❌ Erro ao processar contato ${contact.id}:`, error);
                errors++;
            }
        }

        console.log('\n✅ Correção concluída!');
        console.log(`📊 Estatísticas:`);
        console.log(`   - Atualizados: ${updated}`);
        console.log(`   - Já corretos: ${skipped}`);
        console.log(`   - Erros: ${errors}`);

    } catch (error) {
        console.error('❌ Erro fatal:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar
fixContactPhones();
