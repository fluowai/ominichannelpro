
import axios from 'axios';
async function test() {
  const baseUrl = 'https://wooapi.boow.com.br';
  const userToken = 'oi9000_user_2ezrjw28sc';
  const targetPhone = '554891138937'; // Using my test phone
  
  console.log('--- Testing sendText without session param ---');
  try {
    const r = await axios.post(`${baseUrl}/chat/send/text`, {
        Phone: targetPhone,
        Body: 'Test from script'
    }, {
      headers: { 'token': userToken }
    });
    console.log('Success:', r.data);
  } catch (e: any) {
    console.log('Fail:', e.response?.status, e.response?.data);
  }

  console.log('\n--- Testing sendText with session param ---');
  try {
    const r = await axios.post(`${baseUrl}/chat/send/text`, {
        Phone: targetPhone,
        Body: 'Test from script with param'
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
