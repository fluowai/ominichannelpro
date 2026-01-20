import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  
  console.log(`\n📊 Total de usuários: ${users.length}\n`);
  
  if (users.length === 0) {
    console.log('❌ Nenhum usuário encontrado no banco!\n');
  } else {
    users.forEach(u => {
      console.log(`✅ ${u.email} - ${u.name} (${u.role})`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
