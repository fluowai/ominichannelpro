
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'fluowai@gmail.com' }
  });

  if (user) {
    console.log('✅ User FOUND in DB:', user.email, user.role);
    const valid = await bcrypt.compare('123456', user.password);
    console.log('🔑 Password match for "123456":', valid);
  } else {
    console.log('❌ User NOT found in DB');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
