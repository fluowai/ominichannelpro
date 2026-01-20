
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'fluowai@gmail.com' },
    select: { id: true, email: true, organizationId: true }
  });
  console.log('USER_ORG_CHECK:', JSON.stringify(user));
}

main();
