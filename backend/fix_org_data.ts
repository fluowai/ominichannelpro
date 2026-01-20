
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const email = 'fluowai@gmail.com'; // The user we are fixing
  
  // 1. Create Organization
  console.log('Creating Organization...');
  let org = await prisma.organization.findUnique({ where: { slug: 'fluow-ai' } });
  if (!org) {
      org = await prisma.organization.create({
          data: {
              name: 'Fluow AI Corp',
              slug: 'fluow-ai',
              plan: 'UNLIMITED'
          }
      });
      console.log('Created Org:', org.id);
  } else {
      console.log('Org already exists:', org.id);
  }

  // 2. Assign User to Org
  console.log('Updating User...');
  const user = await prisma.user.update({
      where: { email },
      data: { organizationId: org.id }
  });
  console.log('Updated User:', user.email, '-> Org:', user.organizationId);

  // 3. Assign Integration to Org
  console.log('Updating Integration teste2...');
  const integration = await prisma.integration.updateMany({ // updateMany just in case
      where: { name: 'teste2' },
      data: { organizationId: org.id }
  });
  console.log('Updated Integrations count:', integration.count);

}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
