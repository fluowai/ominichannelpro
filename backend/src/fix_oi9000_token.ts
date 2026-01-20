import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const id = 'cmkixp81f0001pudadt0e9zco';
    const integration = await prisma.integration.findUnique({
        where: { id }
    });
    
    if (integration) {
        const config = integration.config as any;
        const newConfig = {
            ...config,
            userToken: 'oi9000_user_2ezrjw28sc'
        };
        
        await prisma.integration.update({
            where: { id },
            data: { config: newConfig }
        });
        console.log('Updated integration with correct user token.');
    } else {
        console.log('Integration not found.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
