import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para corrigir telefones no formato @lid
 * Executa: npx tsx src/scripts/fix_lid_phones.ts
 */
async function fixLidPhones() {
    console.log('[FIX_PHONES] Starting phone number correction...');
    
    try {
        // Find all contacts with @lid in platformId
        const contactsWithLid = await prisma.contact.findMany({
            where: {
                platformId: {
                    contains: '@lid'
                }
            }
        });

        console.log(`[FIX_PHONES] Found ${contactsWithLid.length} contacts with @lid format`);

        for (const contact of contactsWithLid) {
            // Extract the numeric part from platformId
            const numericPart = contact.platformId?.split('@')[0] || '';
            
            // Check if phone is the same as the @lid number (incorrect)
            if (contact.phone === numericPart) {
                console.log(`[FIX_PHONES] ⚠️  Contact ${contact.name} has incorrect phone: ${contact.phone}`);
                console.log(`[FIX_PHONES]    PlatformId: ${contact.platformId}`);
                console.log(`[FIX_PHONES]    This contact needs manual review or webhook re-processing`);
                
                // We can't automatically fix this without the real phone number
                // The real number should come from remoteJidAlt in future webhook calls
            }
        }

        // Also check for phones that don't start with 55 (Brazil code)
        const contactsWithoutBrazilCode = await prisma.contact.findMany({
            where: {
                AND: [
                    { phone: { not: null } },
                    { phone: { not: { startsWith: '55' } } },
                    { phone: { not: { startsWith: '+55' } } },
                    { platform: 'WHATSAPP' }
                ]
            }
        });

        console.log(`\n[FIX_PHONES] Found ${contactsWithoutBrazilCode.length} contacts without Brazil code`);

        for (const contact of contactsWithoutBrazilCode) {
            const phone = contact.phone || '';
            
            // Only fix if it looks like a valid Brazilian number (10-11 digits)
            if (phone.length >= 10 && phone.length <= 11 && /^\d+$/.test(phone)) {
                const newPhone = '55' + phone;
                
                await prisma.contact.update({
                    where: { id: contact.id },
                    data: { phone: newPhone }
                });
                
                console.log(`[FIX_PHONES] ✅ Fixed ${contact.name}: ${phone} -> ${newPhone}`);
            }
        }

        console.log('\n[FIX_PHONES] ✅ Phone correction completed!');
        console.log('[FIX_PHONES] Note: Contacts with @lid will be automatically fixed when they send new messages.');
    } catch (error) {
        console.error('[FIX_PHONES] ❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixLidPhones();
