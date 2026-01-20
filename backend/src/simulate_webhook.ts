
import axios from 'axios';

async function main() {
  const payload = {
    type: 'messages.upsert',
    instance: 'teste2', // Corrected name (likely)
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'mock_message_' + Date.now()
      },
      pushName: 'Paulo Test',
      message: {
        conversation: 'Oi, teste de webhook local!'
      }
    }
  };

  try {
    console.log('Sending mock webhook...');
    const response = await axios.post('https://floyd-unopposable-diffusely.ngrok-free.dev/webhook/evolution', payload);
    console.log('Response:', response.status, response.data);
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Data:', error.response.data);
    }
  }
}

main();
