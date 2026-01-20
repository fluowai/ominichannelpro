import { prisma } from './src/lib/prisma';
import { hashPassword } from './src/lib/hash';

async function testRegister() {
    const email = 'test' + Date.now() + '@example.com';
    const password = 'password123';
    const name = 'Test User';

    console.log('--- TEST REGISTRATION ---');
    console.log('EMAIL:', email);

    try {
        const hashedPassword = await hashPassword(password);
        const userCount = await prisma.user.count();
        const role = userCount === 0 ? 'SUPER_ADMIN' : 'AGENT';
        
        console.log('PLANNING TO CREATE ORG AND USER. ROLE:', role);

        const orgSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
        const organization = await prisma.organization.create({
            data: {
              name: `${name}'s Organization`,
              slug: orgSlug,
              plan: role === 'SUPER_ADMIN' ? 'ENTERPRISE' : 'FREE'
            }
        });
        console.log('ORG CREATED:', organization.id);

        const user = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              name,
              role: role as any,
              organizationId: organization.id,
            }
        });
        console.log('USER CREATED:', user.id);
    } catch (e) {
        console.error('TEST FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testRegister();
