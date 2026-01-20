import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'fluowai@gmail.com';
  const password = '15077399brsc';
  
  // 1. Create a default organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'fluow-ai' },
    update: {},
    create: {
      name: 'Fluow AI',
      slug: 'fluow-ai',
      plan: 'ENTERPRISE',
    }
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  // 2. Create the super admin user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN'
    },
    create: {
      email,
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      organizationId: organization.id
    }
  });

  console.log('Super Admin created successfully:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
