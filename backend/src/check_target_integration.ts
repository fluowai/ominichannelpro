
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const id = 'cmkiwo6oj0000w4xudwi37nut';
  const integration = await prisma.integration.findUnique({ where: { id } });
  console.log('INTEGRATION:', JSON.stringify(integration, null, 2));
}
run();
