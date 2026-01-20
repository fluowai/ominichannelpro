import axios from 'axios';

async function test() {
  const adminToken = '24897f7f01a3b1d0f0e1f0fc02a58587';
  const baseUrl = 'https://wooapi.boow.com.br';
  const name = 'tesremocao';
  
  const client = axios.create({ 
    baseURL: baseUrl, 
    headers: { 'Authorization': adminToken } 
  });

  console.log(`[TEST] Attempting to delete user by NAME: ${name}`);

  try {
    const r = await client.delete(`/admin/users/${name}`);
    console.log('Delete by NAME successful:', JSON.stringify(r.data, null, 2));
  } catch (e: any) {
    console.log('Delete by NAME failed:', e.response?.status, JSON.stringify(e.response?.data || e.message, null, 2));
    
    const id = 'f9f39056610d2dc6860bdb9ba07f9556';
    const token = 'wz_token_1768744909226';

    console.log(`[TEST] Trying to delete by ID: ${id}`);
    try {
        const rId = await client.delete(`/admin/users/${id}`);
        console.log('Delete by ID successful:', JSON.stringify(rId.data, null, 2));
    } catch (eId: any) {
        console.log('Delete by ID failed:', eId.response?.status, JSON.stringify(eId.response?.data || eId.message, null, 2));
        
        console.log(`[TEST] Trying to delete by TOKEN: ${token}`);
        try {
            const rTok = await client.delete(`/admin/users/${token}`);
            console.log('Delete by TOKEN successful:', JSON.stringify(rTok.data, null, 2));
        } catch (eTok: any) {
             console.log('Delete by TOKEN failed:', eTok.response?.status, JSON.stringify(eTok.response?.data || eTok.message, null, 2));
        }
    }
  }
}

test();
