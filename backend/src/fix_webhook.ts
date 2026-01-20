
import axios from 'axios';
import https from 'https';

async function register() {
  const sessionId = 'paulo34';
  const token = 'wz_token_1768747668691';
  const webhookUrl = 'https://floyd-unopposable-diffusely.ngrok-free.dev/webhook/wuzapi/paulo34';
  
  const body = {
    webhook: webhookUrl,
    events: ['Message', 'ReadReceipt', 'Presence'],
    active: true
  };

  console.log('--- REGISTERING WEBHOOK ---');
  console.log('Target URL:', webhookUrl);

  const agent = new https.Agent({ rejectUnauthorized: false });

  try {
    const res = await axios.put('https://wooapi.boow.com.br/webhook', body, {
      params: { session: sessionId },
      headers: { 'token': token },
      httpsAgent: agent
    });
    
    console.log('SUCCESS!');
    console.log('Server Response:', JSON.stringify(res.data, null, 2));
  } catch (error: any) {
    console.error('FAILED!');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data || error.message);
  }
}

register();
