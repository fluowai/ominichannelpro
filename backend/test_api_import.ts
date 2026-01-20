
import axios from 'axios';

async function main() {
  console.log('--- TEST API IMPORT START ---');

  // 1. Criar uma organização de teste (vamos usar o ID fixo que sabemos que existe)
  const orgId = 'cmkaevfrp0000x8ujoisfsk5z'; 
  const API_URL = 'http://localhost:3333/api';

  try {
    // 2. Criar uma lista via API
    console.log('Creating List via API...');
    const listResponse = await axios.post(`${API_URL}/contact-lists`, {
      name: `API Test List ${Date.now()}`,
      description: 'Created via test_api_import.ts',
      organizationId: orgId
    });

    const listId = listResponse.data.id;
    console.log(`List Created via API! ID: ${listId}`);

    // 3. Importar contatos via API
    console.log(`Importing contacts to List ID: ${listId}...`);
    
    const payload = {
      listId: listId,
      contacts: [
        {
          name: 'API Contact 1',
          phone: '5511888880001',
          platform: 'WHATSAPP',
          platformId: '5511888880001@c.us',
          tags: ['API_TEST']
        },
        {
            name: 'API Contact 2',
            phone: '5511888880002',
            platform: 'WHATSAPP',
            platformId: '5511888880002@c.us',
            tags: ['API_TEST']
        }
      ]
    };

    const importResponse = await axios.post(`${API_URL}/contacts/import`, payload);
    console.log('Import Response Status:', importResponse.status);
    console.log('Import Response Data:', importResponse.data);

    // 4. Verificar se os contatos estão na lista via API
    console.log('Verifying contacts in list...');
    const verifyResponse = await axios.get(`${API_URL}/contact-lists/${listId}/contacts`);
    const contacts = verifyResponse.data.contacts;
    
    console.log(`Contacts found in list: ${contacts.length}`);
    contacts.forEach((c: any) => console.log(` - ${c.name}`));

    if (contacts.length === 2) {
        console.log('✅ SUCCESSO! API está funcionando perfeitamente.');
    } else {
        console.log('❌ FALHA! API retornou sucesso mas contatos não estão na lista.');
    }

  } catch (error: any) {
    if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
    } else {
        console.error('Connection Error:', error.message);
    }
  }
}

main();
