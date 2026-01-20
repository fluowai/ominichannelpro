import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWebhookSetup() {
  console.log('=== WEBHOOK CONFIGURATION CHECK ===\n');

  // Check integrations
  const integrations = await prisma.integration.findMany({
    where: { type: 'EVOLUTION_API' }
  });

  console.log(`Found ${integrations.length} Evolution API integrations:\n`);

  for (const int of integrations) {
    console.log(`Integration: ${int.name}`);
    console.log(`  ID: ${int.id}`);
    console.log(`  Status: ${int.status}`);
    console.log(`  Instance URL: ${int.instanceUrl || 'NOT SET'}`);
    console.log(`  API Key: ${int.apiKey ? '***' + int.apiKey.slice(-4) : 'NOT SET'}`);
    
    const config = int.config as any;
    console.log(`  Instance Name: ${config?.instanceName || 'NOT SET'}`);
    console.log(`  Connection Status: ${config?.connectionStatus || 'UNKNOWN'}`);
    console.log('');
  }

  // Check system settings for global webhook URL
  const settings = await prisma.systemSettings.findUnique({
    where: { key: 'evolution_api' }
  });

  if (settings) {
    const val = settings.value as any;
    console.log('Global Evolution API Settings:');
    console.log(`  Base URL: ${val.baseUrl || 'NOT SET'}`);
    console.log(`  Public URL: ${val.publicUrl || 'NOT SET'}`);
    console.log(`  Global API Key: ${val.globalApiKey ? '***' + val.globalApiKey.slice(-4) : 'NOT SET'}`);
    console.log('');
    
    if (val.publicUrl) {
      console.log(`Expected Webhook URL: ${val.publicUrl}/api/webhooks/evolution`);
    } else {
      console.log('⚠️  WARNING: No public URL configured! Webhooks cannot work.');
    }
  } else {
    console.log('⚠️  WARNING: No global Evolution API settings found!');
  }

  console.log('\n=== CHECK COMPLETE ===');
}

checkWebhookSetup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
