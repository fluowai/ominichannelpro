
import axios from 'axios';
import fs from 'fs';

async function createUser() {
  const adminToken = '24897f7f01a3b1d0f0e1f0fc02a58587';
  const baseUrl = 'https://wooapi.boow.com.br';
  
  const tokenValue = "oi9000_user_" + Math.random().toString(36).substring(4);
  const newUser = {
    name: "oi9000",
    token: tokenValue
  };

  try {
    const response = await axios.post(`${baseUrl}/admin/users`, newUser, {
      headers: {
        'Authorization': adminToken,
        'Content-Type': 'application/json'
      }
    });

    const result = {
        success: true,
        details: newUser,
        apiResponse: response.data
    };
    
    fs.writeFileSync('create_oi9000_result.json', JSON.stringify(result, null, 2), 'utf8');
  } catch (error: any) {
    fs.writeFileSync('create_oi9000_result.json', JSON.stringify({ success: false, error: error.response?.data || error.message }, null, 2), 'utf8');
  }
}

createUser();
