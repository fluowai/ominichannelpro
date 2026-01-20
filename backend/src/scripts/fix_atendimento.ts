import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para corrigir o telefone do contato "Atendimento"
 * Número correto: 5548996228117
 */
async function fixAtendimentoPhone() {
    console.log('[FIX_ATENDIMENTO] Starting phone correction...');
    
    try {
        // Find contact with the @lid phone
        const contact = await prisma.contact.findFirst({
            where: {
                OR: [
                    { phone: { contains: '261314417033283' } },
                    { platformId: { contains: '261314417033283' } },
                    { name: 'Atendimento' }
                ]
            }
        });

        if (!contact) {
            console.log('[FIX_ATENDIMENTO] ❌ Contact not found');
            return;
        }

        console.log(`[FIX_ATENDIMENTO] Found contact: ${contact.name}`);
        console.log(`[FIX_ATENDIMENTO]   Current phone: ${contact.phone}`);
        console.log(`[FIX_ATENDIMENTO]   Current platformId: ${contact.platformId}`);

        // Update with correct phone
        const updatedContact = await prisma.contact.update({
            where: { id: contact.id },
            data: {
                phone: '5548996228117',
                platformId: '5548996228117@s.whatsapp.net'
            }
        });

        console.log('\n[FIX_ATENDIMENTO] ✅ Contact updated successfully!');
        console.log(`[FIX_ATENDIMENTO]   New phone: ${updatedContact.phone}`);
        console.log(`[FIX_ATENDIMENTO]   New platformId: ${updatedContact.platformId}`);
        
    } catch (error) {
        console.error('[FIX_ATENDIMENTO] ❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixAtendimentoPhone();
