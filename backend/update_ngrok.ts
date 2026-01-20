
import { EvolutionService } from './src/services/evolution.service';
import { prisma } from './src/lib/prisma';

async function updateNgrokUrl() {
  const newUrl = 'https://floyd-unopposable-diffusely.ngrok-free.dev'; // Retrieved from screenshot
  const instanceName = 'teste2'; // Hardcoded for now

  try {
    // 1. Update Database
    const currentSettings = await prisma.systemSettings.findUnique({ where: { key: 'evolution_api' } });
    if (currentSettings?.value) {
        const newValue = { ...(currentSettings.value as object), publicUrl: newUrl };
        await prisma.systemSettings.update({
            where: { key: 'evolution_api' },
            data: { value: newValue }
        });
        console.log('✅ Database publicUrl updated.');
    }

    // 2. Update Evolution Webhook
    const apiKey = (currentSettings?.value as any)?.globalApiKey;
    const baseUrl = (currentSettings?.value as any)?.baseUrl;
    
    if (apiKey && baseUrl) {
        const evolution = new EvolutionService(baseUrl, apiKey);
        const webhookUrl = `${newUrl}/webhook/evolution`;
        
        console.log(`Setting webhook to: ${webhookUrl}`);
        await evolution.setWebhook(instanceName, webhookUrl, true, apiKey);
        console.log('✅ Evolution Webhook updated successfully.');
    }
    
  } catch (error) {
    console.error('Script Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNgrokUrl();
