
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncInstances() {
  console.log('🔄 Iniciando sincronização Evolution -> Banco de Dados...');

  // 1. Get Settings
  const settings = await prisma.systemSettings.findUnique({
    where: { key: 'evolution_api' }
  });

  if (!settings || !settings.value) {
    console.error('❌ Configuração da Evolution API não encontrada.');
    return;
  }

  const { baseUrl, globalApiKey } = settings.value as any;

  try {
    // 2. Fetch from Evolution
    console.log(`📡 Buscando instâncias em: ${baseUrl}`);
    const response = await axios.get(`${baseUrl}/instance/fetchInstances`, {
      headers: { 'apikey': globalApiKey }
    });

    const evoInstances = response.data;
    console.log(`📦 Encontradas ${evoInstances.length} instâncias na Evolution.`);

    // 3. Upsert to DB
    for (const inst of evoInstances) {
       const status = inst.instance?.state === 'open' ? 'CONNECTED' : 'DISCONNECTED';
       const name = inst.instance?.instanceName || inst.name; // Evolution v2 structure varies
       
       console.log(`💾 Sincronizando: ${name} (${status})`);

       await prisma.integration.upsert({
         where: { name: name }, // Assuming name is unique enough for sync match, or use a custom ID field if available
         update: {
            status: status,
            type: 'EVOLUTION_API',
            instanceUrl: baseUrl, // or specific instance URL
            apiKey: globalApiKey, // or instance token
            config: inst
         },
         create: {
            name: name,
            type: 'EVOLUTION_API',
            status: status,
            instanceUrl: baseUrl,
            apiKey: globalApiKey,
            config: inst
         }
       });
    }

    console.log('✅ Sincronização concluída com sucesso!');

  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error.message);
    if(error.response) console.error(error.response.data);
  }
}

syncInstances()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
