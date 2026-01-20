
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- USERS ---');
  const users = await prisma.user.findMany({ include: { organization: true } });
  console.log(JSON.stringify(users.map(u => ({ id: u.id, role: u.role, orgId: u.organizationId, orgName: u.organization?.name })), null, 2));

  console.log('\n--- INTEGRATIONS ---');
  const integrations = await prisma.integration.findMany();
  console.log(JSON.stringify(integrations.map(i => ({ id: i.id, name: i.name, orgId: i.organizationId, type: i.type })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
