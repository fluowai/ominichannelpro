
import axios from 'axios';
async function test() {
  const baseUrl = 'https://wooapi.boow.com.br';
  const userToken = 'oi9000_user_2ezrjw28sc';
  
  try {
    const r = await axios.post(`${baseUrl}/session/connect`, {
        Subscribe: ["Message"],
        Immediate: true
    }, {
      headers: { 'token': userToken }
    });
    console.log('Connect success:', r.data);
  } catch (e: any) {
    console.log('Connect fail:', e.response?.status, e.response?.data);
  }
}
test();
