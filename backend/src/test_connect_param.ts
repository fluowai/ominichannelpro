
import axios from 'axios';
async function test() {
  const baseUrl = 'https://wooapi.boow.com.br';
  const userToken = 'oi9000_user_2ezrjw28sc';
  
  console.log('--- Testing connect with session param ---');
  try {
    const r = await axios.post(`${baseUrl}/session/connect`, {
        Subscribe: ["Message"],
        Immediate: true
    }, {
      params: { session: 'oi9000' },
      headers: { 'token': userToken }
    });
    console.log('Success:', r.data);
  } catch (e: any) {
    console.log('Fail:', e.response?.status, e.response?.data);
  }
}
test();
