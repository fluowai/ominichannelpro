
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({ 
        where: { email: 'fluowai@gmail.com' },
        select: { id: true, email: true, organizationId: true, name: true }
    });
    console.log('User found:', user);

    if (user && !user.organizationId) {
        // Find default or first organization
        let org = await prisma.organization.findFirst({
            where: { isDefault: true }
        });

        if (!org) {
            org = await prisma.organization.findFirst();
        }

        if (org) {
            console.log(`Assigning user to organization: ${org.name} (${org.id})`);
            await prisma.user.update({
                where: { email: 'fluowai@gmail.com' },
                data: { organizationId: org.id }
            });
            console.log('User updated successfully.');
        } else {
            console.log('No organization found to assign.');
            // Create one?
            const newOrg = await prisma.organization.create({
                data: {
                    name: 'Fluow Organization',
                    slug: 'fluow-org', // Add slug just in case
                    isDefault: true
                }
            });
            console.log(`Created new organization: ${newOrg.name}`);
             await prisma.user.update({
                where: { email: 'fluowai@gmail.com' },
                data: { organizationId: newOrg.id }
            });
            console.log('User updated with new org.');
        }
    } else {
        console.log('User already has authorization or not found.');
    }

  } catch (e) {
      console.error(e);
  } finally {
      await prisma.$disconnect();
  }
}

main();
