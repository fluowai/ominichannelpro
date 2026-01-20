
import axios from 'axios';

async function checkNgrok() {
    try {
        const response = await axios.get('http://127.0.0.1:4040/api/tunnels');
        const tunnels = response.data.tunnels;
        if (tunnels && tunnels.length > 0) {
            console.log('✅ Active Ngrok Tunnels:');
            tunnels.forEach((t: any) => {
                console.log(`- ${t.public_url} -> ${t.config.addr}`);
            });
        } else {
            console.log('⚠️ No active tunnels found via API.');
        }
    } catch (error: any) {
        console.error('❌ Could not query Ngrok API (Is Ngrok running?):', error.message);
    }
}

checkNgrok();
