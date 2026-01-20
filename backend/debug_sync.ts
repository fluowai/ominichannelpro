
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncInstances() {
  console.log('START_SYNC');

  const settings = await prisma.systemSettings.findUnique({
    where: { key: 'evolution_api' }
  });

  if (!settings || !settings.value) {
    console.error('NO_SETTINGS');
    return;
  }

  const { baseUrl, globalApiKey } = settings.value as any;
  console.log('URL:', baseUrl);

  try {
    const response = await axios.get(`${baseUrl}/instance/fetchInstances`, {
      headers: { 'apikey': globalApiKey }
    });
    
    // Evolution sometimes returns object with array inside? No, usually array.
    // Check type
    const data = response.data;
    console.log('DATA_TYPE:', Array.isArray(data) ? 'Array' : typeof data);
    
    let list = [];
    if (Array.isArray(data)) list = data;
    else if (data && Array.isArray(data.instances)) list = data.instances; // fallback
    else if (data) list = [data];

    console.log('COUNT_FOUND:', list.length);

    for (const item of list) {
        // Handle v2 structure
        const realInstance = item.instance || item;
        const name = realInstance.instanceName || realInstance.name;
        
        if (!name) {
            console.log('SKIP_NO_NAME', JSON.stringify(item));
            continue;
        }

        console.log('UPSERTING:', name);
        
        // Check if exists
        const existing = await prisma.integration.findFirst({
            where: { name: name }
        });

        if (existing) {
             console.log('UPDATING:', name, existing.id);
             await prisma.integration.update({
                where: { id: existing.id },
                data: {
                    status: 'CONNECTED',
                    type: 'EVOLUTION_API',
                    instanceUrl: baseUrl,
                    apiKey: globalApiKey,
                    config: item
                }
             });
        } else {
             console.log('CREATING:', name);
             await prisma.integration.create({
                data: {
                    name: name,
                    type: 'EVOLUTION_API',
                    status: 'CONNECTED',
                    instanceUrl: baseUrl, // or specific
                    apiKey: globalApiKey,
                    config: item
                }
             });
        }
    }
    console.log('DONE_SYNC');

  } catch (e: any) {
    console.error('ERROR:', e.message);
    if (e.response) console.error('Data:', JSON.stringify(e.response.data));
  }
}

// Schema check: Does Integration have unique name?
// If not, upsert on name is invalid.
// We should check DB schema first.

syncInstances()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
