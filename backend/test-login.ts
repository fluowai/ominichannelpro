import { comparePassword } from './src/lib/hash';
import { prisma } from './src/lib/prisma';

async function testLogin() {
  const email = 'fluowai@gmail.com';
  const password = 'Argo@1507';

  console.log('--- TEST LOGIN ---');
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('User found:', user.email);
    console.log('Stored hash:', user.password);

    const isValid = await comparePassword(password, user.password);
    console.log('Password valid:', isValid);

    if (isValid) {
        console.log('LOGIN SUCCESS SIMULATION');
    } else {
        console.log('LOGIN FAILED SIMULATION');
    }
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
