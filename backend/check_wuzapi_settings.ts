
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { key: 'wuzapi' }
    });
    console.log('--- WUZAPI Settings in DB ---');
    console.log(JSON.stringify(settings, null, 2));
    
    fs.writeFileSync('wuzapi_settings.json', JSON.stringify(settings, null, 2));
    console.log('Saved to wuzapi_settings.json');

  } catch (error) {
    console.error('Error fetching settings:', error);
    fs.writeFileSync('wuzapi_settings.json', JSON.stringify({ error: error.message }));
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
