
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany(); // Assuming only 1 user or few
  console.log('--- USERS ---');
  console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email, role: u.role })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
