import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para corrigir o telefone do contato específico
 * Número correto: 5548988003260
 */
async function fixPhoneNumber() {
    console.log('[FIX_PHONE] Starting phone correction...');
    
    try {
        // Find contact with the @lid phone
        const contact = await prisma.contact.findFirst({
            where: {
                OR: [
                    { phone: { contains: '104565810663442' } },
                    { phone: { contains: '551045658106663442' } },
                    { platformId: { contains: '104565810663442' } }
                ]
            }
        });

        if (!contact) {
            console.log('[FIX_PHONE] ❌ Contact not found');
            return;
        }

        console.log(`[FIX_PHONE] Found contact: ${contact.name}`);
        console.log(`[FIX_PHONE]   Current phone: ${contact.phone}`);
        console.log(`[FIX_PHONE]   Current platformId: ${contact.platformId}`);

        // Update with correct phone
        const updatedContact = await prisma.contact.update({
            where: { id: contact.id },
            data: {
                phone: '5548988003260',
                platformId: '5548988003260@s.whatsapp.net'
            }
        });

        console.log('\n[FIX_PHONE] ✅ Contact updated successfully!');
        console.log(`[FIX_PHONE]   New phone: ${updatedContact.phone}`);
        console.log(`[FIX_PHONE]   New platformId: ${updatedContact.platformId}`);
        
    } catch (error) {
        console.error('[FIX_PHONE] ❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixPhoneNumber();
