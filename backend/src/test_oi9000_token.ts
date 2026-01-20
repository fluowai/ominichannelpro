
import axios from 'axios';
async function test() {
  const baseUrl = 'https://wooapi.boow.com.br';
  const userToken = 'oi9000_user_2ezrjw28sc';
  
  console.log('--- Testing with token header ---');
  try {
    const r1 = await axios.get(`${baseUrl}/session/status`, {
      headers: { 'token': userToken }
    });
    console.log('Token header success:', r1.data);
  } catch (e: any) {
    console.log('Token header fail:', e.response?.status, e.response?.data);
  }

  console.log('\n--- Testing with Authorization header ---');
  try {
    const r2 = await axios.get(`${baseUrl}/session/status`, {
      headers: { 'Authorization': userToken }
    });
    console.log('Auth header success:', r2.data);
  } catch (e: any) {
    console.log('Auth header fail:', e.response?.status, e.response?.data);
  }
}
test();
