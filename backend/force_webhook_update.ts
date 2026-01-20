
import { EvolutionService } from './src/services/evolution.service';
import { prisma } from './src/lib/prisma';

async function forceUpdateWebhook() {
  try {
      const settings = await prisma.systemSettings.findUnique({ where: { key: 'evolution_api' } });
      const val = settings?.value as any;
      
      const instanceName = 'teste2'; 
      const apiKey = val.globalApiKey;
      const publicUrl = val.publicUrl;

      if (!publicUrl) {
          console.error('No publicUrl found in settings');
          return;
      }

      const evolution = new EvolutionService(val.baseUrl, apiKey);
      
      // The user wants /webhook/evolution
      const webhookUrl = `${publicUrl}/webhook/evolution`;
      
      console.log(`Force updating webhook for ${instanceName} to: ${webhookUrl}`);
      
      await evolution.setWebhook(instanceName, webhookUrl, apiKey);
      console.log('Success! Webhook updated.');
      
  } catch (error) {
    console.error('Script Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceUpdateWebhook();
