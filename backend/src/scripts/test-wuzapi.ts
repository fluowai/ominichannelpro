import axios from 'axios';

const WUZAPI_URL = 'https://wooapi.boow.com.br';
const USER_TOKEN = 'wz_token_1768751951520';
const SESSION_ID = 'p1';

async function testWuzapi() {
  console.log(`--- TESTING WUZAPI ---`);
  console.log(`URL: ${WUZAPI_URL}`);
  console.log(`Session: ${SESSION_ID}`);
  
  const client = axios.create({
    baseURL: WUZAPI_URL,
    headers: {
      'Content-Type': 'application/json',
      'token': USER_TOKEN
    }
  });

  try {
    console.log('\nChecking Session Status...');
    const statusRes = await client.get('/session/status', { params: { session: SESSION_ID } });
    console.log('Status Response:', JSON.stringify(statusRes.data, null, 2));

    if (statusRes.data?.data?.connected) {
      console.log('\nSession is CONNECTED. Attempting to send a test message to myself?');
      // Using the JID from logs: 554891138937:20@s.whatsapp.net
      const myJid = statusRes.data?.data?.jid?.split(':')[0] + '@s.whatsapp.net';
      console.log(`Target JID: ${myJid}`);
      
      try {
        const sendRes = await client.post('/chat/send/text', {
          Phone: myJid,
          Body: 'Teste de conexão FLUOW AI - ' + new Date().toISOString()
        }, { params: { session: SESSION_ID } });
        console.log('Send Response:', JSON.stringify(sendRes.data, null, 2));
      } catch (sendErr: any) {
        console.error('Send Error:', sendErr.response?.data || sendErr.message);
      }
    } else {
      console.log('\nSession is NOT connected. QR code might be needed.');
    }
  } catch (error: any) {
    console.error('\nAPI Error:', error.response?.status, error.response?.data || error.message);
  }
}

testWuzapi();
