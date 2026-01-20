
import { EvolutionService } from './src/services/evolution.service';
import { prisma } from './src/lib/prisma';
import axios from 'axios';

async function checkWebhookReal() {
  try {
      const settings = await prisma.systemSettings.findUnique({ where: { key: 'evolution_api' } });
      const val = settings?.value as any;
      
      console.log('Global Config:', val);
      
      const instanceName = 'teste2'; // Hardcoded based on user input
      const apiKey = val.globalApiKey;
      
      // Let's call the Evolution API endpoint to GET settings
      // Evolution API usually has /instance/fetchInstances or specific webhook endpoints
      // Checking EvolutionService implementation
      
      const evolution = new EvolutionService(val.baseUrl, apiKey);
      
      // Fetch instance data which usually contains webhook info
      const instanceUrl = `${val.baseUrl}/webhook/find/${instanceName}`;
      console.log(`Checking webhook at: ${instanceUrl}`);
      
      try {
        const response = await axios.get(instanceUrl, {
            headers: { apiKey: apiKey }
        });
        console.log('Current Webhook Config:', JSON.stringify(response.data, null, 2));
      } catch(e: any) {
          console.error('Error fetching webhook config:', e.response?.data || e.message);
      }
      
  } catch (error) {
    console.error('Script Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWebhookReal();
