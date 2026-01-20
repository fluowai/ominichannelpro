
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });
  console.log('--- USERS IN DATABASE ---');
  if (users.length === 0) {
    console.log('No users found.');
  } else {
    users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`));
  }
}

main().finally(() => prisma.$disconnect());
