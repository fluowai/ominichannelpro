
import axios from 'axios';
import fs from 'fs';

const settings = JSON.parse(fs.readFileSync('wuzapi_settings.json', 'utf8'));
const config = settings.value;

async function testUrl(url: string) {
  console.log(`Testing URL: ${url}`);
  try {
    const client = axios.create({
      baseURL: url,
      headers: {
        'Content-Type': 'application/json',
        'token': config.userToken
      },
      timeout: 5000
    });

    const response = await client.get('/status'); // Tenta um endpoint comum ou só o base
    // OBS: O endpoint /status no WuzapiService é `/{sessionId}/status`, mas aqui quero testar a API root.
    // Vamos tentar criar um axios e chamar /status na raiz, ou checar se existe rota.
    // Na verdade, WuzapiService chama `/${sessionId}/start-session`.
    // Vamos tentar listar sessions ou algo genérico se existir.
    // Ou simplesmente ver se o servidor responde.
    
    console.log(`[SUCCESS] ${url} responded:`, response.status);
    return true;
  } catch (error: any) {
    console.log(`[FAIL] ${url} error:`, error.message, error.response?.status);
    return false;
  }
}

async function run() {
  const originalUrl = config.apiUrl;
  // Test 1: Original
  await testUrl(originalUrl);

  // Test 2: With /api
  if (!originalUrl.endsWith('/api')) {
    const urlWithApi = originalUrl.replace(/\/$/, '') + '/api';
    await testUrl(urlWithApi);
  }
}

run();
