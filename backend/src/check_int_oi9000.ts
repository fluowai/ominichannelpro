import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const int = await prisma.integration.findUnique({ where: { id: 'cmkixp81f0001pudadt0e9zco' } });
  console.log(JSON.stringify(int, null, 2));
}
check().then(() => process.exit(0));
