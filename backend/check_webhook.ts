
import { EvolutionService } from './src/services/evolution.service';
import { prisma } from './src/lib/prisma';

async function checkWebhook() {
  const integration = await prisma.integration.findFirst({
      where: { 
          OR: [
              { config: { path: ['instanceName'], equals: 'teste2' } },
              { name: 'teste2' } // Fallback
          ]
      }
  });
  
  // Actually, let's just list all integrations
  const integrations = await prisma.integration.findMany();
  console.log('Integrations:', integrations);

  if(integrations.length > 0) {
      const i = integrations[0];
      // Get global config
      const settings = await prisma.systemSettings.findUnique({ where: { key: 'evolution_api' } });
      const val = settings?.value as any;
      
      const evolution = new EvolutionService(val.baseUrl, val.globalApiKey);
      
      // Assume instance name from config or name
      const instanceName = (i.config as any)?.instanceName || i.name;
      
      try {
        const payload = await evolution.fetchInstance(instanceName, val.globalApiKey);
        console.log('Instance Data:', JSON.stringify(payload, null, 2));
      } catch (e) {
          console.error('Error fetching instance:', e);
      }
  }
}

checkWebhook();
