
import axios from 'axios';
async function test() {
  const baseUrl = 'https://wooapi.boow.com.br';
  const userToken = 'oi9000_user_2ezrjw28sc';
  
  console.log('--- Testing webhook without session param ---');
  try {
    const r = await axios.put(`${baseUrl}/webhook`, {
        webhook: 'http://localhost:3333/test',
        events: ["Message"],
        active: true
    }, {
      headers: { 'token': userToken }
    });
    console.log('Success:', r.data);
  } catch (e: any) {
    console.log('Fail:', e.response?.status, e.response?.data);
  }

  console.log('\n--- Testing webhook with session param ---');
  try {
    const r = await axios.put(`${baseUrl}/webhook`, {
        webhook: 'http://localhost:3333/test',
        events: ["Message"],
        active: true
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
