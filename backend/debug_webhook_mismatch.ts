
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWebhook() {
  const settings = await prisma.systemSettings.findUnique({
    where: { key: 'evolution_api' }
  });

  if (!settings || !settings.value) {
    console.log('No settings found');
    return;
  }

  const { baseUrl, globalApiKey, publicUrl } = settings.value as any;
  console.log('--- LOCAL SETTINGS ---');
  console.log('Current Public URL (DB):', publicUrl);
  console.log('Target Instance: teste2');

  try {
    // Evolution v2 endpoint to find webhook might be /webhook/find/:instance
    console.log(`\n--- CHECKING EVOLUTION FOR teste2 ---`);
    const response = await axios.get(`${baseUrl}/webhook/find/teste2`, {
      headers: { 'apikey': globalApiKey }
    });

    console.log('Evolution Webhook Config:', JSON.stringify(response.data, null, 2));

    const evoUrl = response.data?.webhook?.url || response.data?.url;

    if (evoUrl !== publicUrl + '/api/webhooks/evolution') {
        console.warn('\n⚠️ WARNING: URL MISMATCH!');
        console.warn(`Expected: ${publicUrl}/api/webhooks/evolution`);
        console.warn(`Actual:   ${evoUrl}`);
    } else {
        console.log('\n✅ URL MATCH! Webhook is correctly configured.');
    }

  } catch (error: any) {
    console.error('Error fetching webhook:', error.response?.data || error.message);
  }
}

checkWebhook()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
