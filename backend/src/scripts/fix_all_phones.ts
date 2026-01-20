import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para corrigir TODOS os telefones no formato incorreto
 * Remove números @lid e formata corretamente números brasileiros
 */
async function fixAllPhones() {
    console.log('[FIX_ALL] Starting bulk phone correction...\n');
    
    try {
        // 1. Get ALL contacts to analyze
        const allContacts = await prisma.contact.findMany({
            where: {
                platform: 'WHATSAPP'
            }
        });

        console.log(`[FIX_ALL] Analyzing ${allContacts.length} WhatsApp contacts...\n`);

        const contactsWithLid: any[] = [];
        const contactsToFix: any[] = [];
        const contactsToFixPlatformId: any[] = [];

        // Analyze each contact
        for (const contact of allContacts) {
            const phone = contact.phone || '';
            const platformId = contact.platformId || '';

            // Check for @lid
            if (phone.includes('@lid') || platformId.includes('@lid') || phone.length > 13) {
                contactsWithLid.push(contact);
            }
            // Check if needs Brazil code
            else if (phone && !phone.startsWith('55') && !phone.startsWith('+55') && phone.length >= 10 && phone.length <= 11 && /^\d+$/.test(phone)) {
                contactsToFix.push(contact);
            }
            // Check if has correct phone but wrong platformId
            else if (phone.startsWith('55') && phone.length >= 12 && phone.length <= 13 && /^\d+$/.test(phone) && !platformId.endsWith('@s.whatsapp.net')) {
                contactsToFixPlatformId.push(contact);
            }
        }

        console.log(`[FIX_ALL] Found ${contactsWithLid.length} contacts with @lid format`);
        
        if (contactsWithLid.length > 0) {
            console.log('\n⚠️  These contacts have @lid and need manual correction:');
            for (const contact of contactsWithLid) {
                console.log(`   - ${contact.name}: ${contact.phone} (platformId: ${contact.platformId})`);
            }
            console.log('\n   ❌ Cannot auto-fix @lid contacts - they need manual phone number input\n');
        }

        // 2. Fix contacts without Brazil code
        console.log(`[FIX_ALL] Found ${contactsToFix.length} contacts without Brazil code (55)\n`);

        let fixedCount = 0;
        for (const contact of contactsToFix) {
            const phone = contact.phone || '';
            const newPhone = '55' + phone;
            const newPlatformId = `${newPhone}@s.whatsapp.net`;
            
            await prisma.contact.update({
                where: { id: contact.id },
                data: { 
                    phone: newPhone,
                    platformId: newPlatformId
                }
            });
            
            console.log(`   ✅ ${contact.name}: ${phone} → ${newPhone}`);
            fixedCount++;
        }

        // 3. Fix contacts with wrong platformId
        console.log(`\n[FIX_ALL] Found ${contactsToFixPlatformId.length} contacts with wrong platformId\n`);

        for (const contact of contactsToFixPlatformId) {
            const phone = contact.phone || '';
            const newPlatformId = `${phone}@s.whatsapp.net`;
            
            await prisma.contact.update({
                where: { id: contact.id },
                data: { platformId: newPlatformId }
            });
            
            console.log(`   ✅ ${contact.name}: platformId updated to ${newPlatformId}`);
            fixedCount++;
        }

        console.log(`\n[FIX_ALL] ✅ Fixed ${fixedCount} contacts successfully!`);
        
        if (contactsWithLid.length > 0) {
            console.log(`\n⚠️  ${contactsWithLid.length} contacts with @lid still need manual correction`);
            console.log('   Run this script with the real phone numbers to fix them.');
        }
        
    } catch (error) {
        console.error('[FIX_ALL] ❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixAllPhones();
