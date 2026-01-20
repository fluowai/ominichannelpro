import { prisma } from './src/lib/prisma';

async function check() {
  console.log('--- DB VERIFICATION ---');
  try {
    const userCount = await prisma.user.count();
    console.log('Total Users:', userCount);

    const users = await prisma.user.findMany({
      include: { organization: true }
    });

    users.forEach(u => {
      console.log(`- Email: ${u.email}, Role: ${u.role}, Org: ${u.organization?.name || 'NONE'}`);
    });
  } catch (e) {
    console.error('Check failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
