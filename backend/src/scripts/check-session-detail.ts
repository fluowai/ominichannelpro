import axios from 'axios';

const WUZAPI_URL = 'https://wooapi.boow.com.br';
const USER_TOKEN = 'wz_token_1768751951520';
const SESSION_ID = 'p1';

async function checkSession() {
  console.log(`--- CHECKING WUZAPI SESSION ---`);
  
  const client = axios.create({
    baseURL: WUZAPI_URL,
    headers: {
      'Content-Type': 'application/json',
      'token': USER_TOKEN
    }
  });

  try {
    const res = await client.get('/session/status', { params: { session: SESSION_ID } });
    const data = res.data?.data;
    console.log('Session Name:', data?.name);
    console.log('Connected:', data?.connected);
    console.log('Logged In:', data?.loggedIn);
    console.log('WID (Phone):', data?.jid || data?.id);
    console.log('Webhook:', data?.webhook);

  } catch (error: any) {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
  }
}

checkSession();
