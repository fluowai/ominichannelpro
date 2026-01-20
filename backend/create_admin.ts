import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Recriando usuário admin...\n');

  // 1. Criar organização padrão
  const org = await prisma.organization.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Organização Principal',
      slug: 'principal',
      domain: 'fluowai.com'
    }
  });
  console.log(`✅ Organização: ${org.name}`);

  // 2. Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'fluowai@gmail.com' },
    update: {},
    create: {
      email: 'fluowai@gmail.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      organizationId: org.id
    }
  });

  console.log(`✅ Usuário criado: ${user.email}`);
  console.log(`   Senha: admin123`);
  console.log(`   Role: ${user.role}\n`);

  console.log('🎉 Pronto! Agora você pode fazer login.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
