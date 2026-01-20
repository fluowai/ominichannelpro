
import { WuzapiService } from './src/services/wuzapi.service';

async function testWuzapi() {
  const apiUrl = 'https://wooapi.boow.com.br';
  const userToken = '24897f7f01a3b1d0f0e1f0fc02a58587';
  
  console.log(`[TEST] Testing WUZAPI Connection to ${apiUrl}...`);

  const wuzapi = new WuzapiService(apiUrl, userToken);

  try {
    // 1. Create Session / Connect
    console.log('[TEST] Calling createSession (/session/connect)...');
    // SessionID is ignored by WooAPI, passing dummy
    const connectResp = await wuzapi.createSession('test-session');
    console.log('[TEST] Connect Response:', JSON.stringify(connectResp, null, 2));

    // 2. Client might be connected or needs QR
    // Check Status first
    console.log('[TEST] Checking Status (/session/status)...');
    const statusResp = await wuzapi.checkConnection('test-session');
    console.log('[TEST] Status Response:', statusResp);

    if (statusResp.connected) {
        console.log('[TEST] ✅ Already Connected!');
    } else {
        console.log('[TEST] Not connected. Fetching QR Code (/session/qr)...');
        const qrResp = await wuzapi.getQRCode('test-session');
        console.log('[TEST] QR Code Response:', qrResp.qr ? '(QR Code Data Present)' : 'No QR Data');
        
        if (qrResp.qr) {
            console.log('[TEST] ✅ QR Code retrieved successfully!');
            console.log('[TEST] QR Data Length:', qrResp.qr.length);
            console.log('[TEST] Sample:', qrResp.qr.substring(0, 50) + '...');
        } else {
            console.error('[TEST] ❌ Failed to get QR Code data');
        }
    }

  } catch (error: any) {
    console.error('[TEST] ❌ Error:', error.response?.data || error.message);
    if (error.response) {
        console.error('[TEST] Status:', error.response.status);
    }
  }
}

testWuzapi();
