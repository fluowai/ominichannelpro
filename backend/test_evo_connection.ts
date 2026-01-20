
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  const settings = await prisma.systemSettings.findUnique({
    where: { key: 'evolution_api' }
  });

  if (!settings || !settings.value) {
    console.log('❌ Sem configurações salvas no banco.');
    return;
  }

  const { baseUrl, globalApiKey } = settings.value as any;
  console.log(`📡 Testando conexão com: ${baseUrl}`);
  console.log(`🔑 API Key (inicio): ${globalApiKey.substring(0, 5)}...`);

  try {
    const response = await axios.get(`${baseUrl}/instance/fetchInstances`, {
      headers: {
        'apikey': globalApiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ SUCESSO! Instâncias encontradas:', response.data.length);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('❌ FALHA NA CONEXÃO:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testConnection()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
