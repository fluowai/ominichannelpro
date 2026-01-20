
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();
async function run() {
  const id = 'cmkiwo6oj0000w4xudwi37nut';
  const integration = await prisma.integration.findUnique({ where: { id } });
  fs.writeFileSync('target_integration_utf8.json', JSON.stringify(integration, null, 2), 'utf8');
  console.log('Done');
}
run();
