
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEvoWebhook() {
  const settings = await prisma.systemSettings.findUnique({
    where: { key: 'evolution_api' }
  });

  if (!settings || !settings.value) { console.log('No Settings'); return; }
  const { baseUrl, globalApiKey } = settings.value as any;

  try {
    const res = await axios.get(`${baseUrl}/webhook/find/teste2`, {
        headers: { apikey: globalApiKey }
    });
    console.log('WEBHOOK_CONFIG:', JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error('ERROR:', e.message);
  }
}

checkEvoWebhook();
