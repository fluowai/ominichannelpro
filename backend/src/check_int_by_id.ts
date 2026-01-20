import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const id = 'cmkixp81f0001pudadt0e9zco';
    const integration = await prisma.integration.findUnique({
        where: { id }
    });
    console.log(JSON.stringify(integration, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
