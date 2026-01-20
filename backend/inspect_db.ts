
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- USERS ---');
  const users = await prisma.user.findMany({
      include: { organization: true }
  });
  console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email, orgId: u.organizationId, orgName: u.organization?.name })), null, 2));

  console.log('\n--- AGENTS ---');
  const agents = await prisma.agent.findMany();
  console.log(JSON.stringify(agents.map(a => ({ id: a.id, name: a.name, userId: a.userId, orgId: a.organizationId })), null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
