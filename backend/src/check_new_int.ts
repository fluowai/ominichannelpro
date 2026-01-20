import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const id = 'cmkj25quh0000c7y0b24c3lfo';
    const integration = await prisma.integration.findUnique({
        where: { id }
    });
    fs.writeFileSync('new_int_check.json', JSON.stringify(integration, null, 2), 'utf8');
    process.exit(0);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
