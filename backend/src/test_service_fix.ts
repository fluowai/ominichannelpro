
import { WuzapiService } from './services/wuzapi.service.js';
import axios from 'axios';

async function test() {
  const baseUrl = 'https://wooapi.boow.com.br';
  const userToken = 'oi9000_user_2ezrjw28sc';
  const sessionId = 'oi9000';
  
  const wuzapi = new WuzapiService(baseUrl, userToken);
  console.log('--- Testing checkConnection ---');
  try {
    const status = await wuzapi.checkConnection(sessionId);
    console.log('Status result:', status);
  } catch (e: any) {
    console.log('Status fail:', e.response?.status, e.response?.data);
  }
}
test();
