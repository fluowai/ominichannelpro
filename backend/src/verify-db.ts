import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando usuários no banco de dados...');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true
    }
  });

  console.log('Total de usuários encontrados:', users.length);
  users.forEach(u => {
    console.log(`- ${u.email} (${u.role}) [Org: ${u.organizationId}]`);
  });

  const orgs = await prisma.organization.findMany();
  console.log('\nOrganizações encontradas:', orgs.length);
  orgs.forEach(o => {
    console.log(`- ${o.name} (${o.slug}) [ID: ${o.id}]`);
  });
}

main()
  .catch((e) => {
    console.error('Erro ao verificar:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
