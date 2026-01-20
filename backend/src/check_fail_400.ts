
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();
async function check() {
  const integration = await prisma.integration.findUnique({ 
    where: { id: 'cmkixp81f0001pudadt0e9zco' } 
  });
  fs.writeFileSync('integration_check_400.json', JSON.stringify(integration, null, 2), 'utf8');
}
check().then(() => process.exit(0));
