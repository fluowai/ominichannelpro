import { prisma } from './src/lib/prisma';
async function clean() {
    console.log('--- CLEANING DATABASE ---');
    await prisma.refreshToken.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.integration.deleteMany();
    await prisma.agent.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    console.log('DONE.');
}
clean().finally(() => prisma.$disconnect());
