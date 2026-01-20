
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();
async function check() {
  const settings = await prisma.systemSettings.findMany();
  fs.writeFileSync('all_settings_v2.json', JSON.stringify(settings, null, 2), 'utf8');
}
check().then(() => process.exit(0));
