import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para corrigir usuários sem organizationId
 * Executa: npx tsx src/scripts/fix_missing_organizations.ts
 */
async function fixMissingOrganizations() {
    console.log('[FIX_ORG] Starting migration...');
    
    try {
        // Find all users without organizationId
        const usersWithoutOrg = await prisma.user.findMany({
            where: { organizationId: null }
        });

        console.log(`[FIX_ORG] Found ${usersWithoutOrg.length} users without organization`);

        for (const user of usersWithoutOrg) {
            const orgSlug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
            
            // Create organization
            const org = await prisma.organization.create({
                data: {
                    name: `${user.name}'s Organization`,
                    slug: orgSlug
                }
            });

            // Link to user
            await prisma.user.update({
                where: { id: user.id },
                data: { organizationId: org.id }
            });

            console.log(`[FIX_ORG] ✅ Created organization for ${user.email} (${org.slug})`);
        }

        console.log('[FIX_ORG] ✅ Migration completed successfully!');
    } catch (error) {
        console.error('[FIX_ORG] ❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixMissingOrganizations();
