import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('--- USER LIST ---');
  console.log('COUNT:', users.length);
  for (const user of users) {
    console.log('EMAIL:', user.email, 'ROLE:', user.role);
  }
}
main().finally(() => prisma.$disconnect());
