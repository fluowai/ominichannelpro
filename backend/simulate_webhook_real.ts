
import axios from 'axios';

const payload = {
  "type": "messages.upsert",
  "instance": "teste2",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "BAE5F6B6A56C"
    },
    "pushName": "Paulo Tester",
    "message": {
      "conversation": "Olá, gostaria de saber sobre imóveis em São Paulo"
    },
    "messageType": "conversation"
  }
};

async function run() {
  try {
    const publicUrl = 'https://floyd-unopposable-diffusely.ngrok-free.dev/webhook/evolution';
    console.log(`Sending webhook to ${publicUrl}...`);
    const res = await axios.post(publicUrl, payload);
    console.log('Status:', res.status);
    console.log('Response:', res.data);
  } catch (e: any) {
    console.error('Error:', e.message);
    if(e.response) console.error('Data:', e.response.data);
  }
}

run();
