
import { PrismaClient } from '@prisma/client';
import { contactsService } from './src/services/contacts.service'; // Ajuste o caminho conforme necessário

const prisma = new PrismaClient();

async function main() {
  console.log('--- TEST IMPORT LOGIC START ---');

  // 1. Criar uma Organização de Teste (se necessário) ou usar uma existente
  const orgId = 'cmkaevfrp0000x8ujoisfsk5z'; // ID da sua organização (peguei dos logs anteriores)
  console.log(`Using Organization ID: ${orgId}`);

  // 2. Criar uma Lista de Teste
  const listName = `Lista Teste Script ${new Date().getTime()}`;
  console.log(`Creating test list: ${listName}`);
  
  const newList = await prisma.contactList.create({
    data: {
      name: listName,
      description: 'Lista criada pelo script de debug',
      organizationId: orgId
    }
  });
  console.log(`List Created! ID: ${newList.id}`);

  // 3. Simular dados de contatos para importar
  const contactsToImport = [
    {
      name: 'Contato Teste 1',
      phone: '5511999990001',
      platform: 'WHATSAPP' as const,
      platformId: '5511999990001@c.us',
      tags: ['TESTE_SCRIPT'],
    },
    {
      name: 'Contato Teste 2',
      phone: '5511999990002',
      platform: 'WHATSAPP' as const,
      platformId: '5511999990002@c.us',
      tags: ['TESTE_SCRIPT'],
    }
  ];

  console.log('Importing 2 contacts...');

  // 4. Chamar o serviço de importação
  try {
    // @ts-ignore - Ignorando erros de tipagem estrita para o teste
    const result = await contactsService.importContacts(contactsToImport, newList.id);
    console.log('Import Result:', result);
  } catch (error) {
    console.error('ERROR during importContacts:', error);
  }

  // 5. Verificar se os contatos foram vinculados
  console.log(`Checking database for list ${newList.id}...`);
  
  const listCheck = await prisma.contactList.findUnique({
    where: { id: newList.id },
    include: {
      contacts: true,
      _count: {
        select: { contacts: true }
      }
    }
  });

  if (listCheck) {
    console.log(`Final Contact Count: ${listCheck._count.contacts}`);
    console.log('Contacts in list:', listCheck.contacts.map(c => c.name));
    
    if (listCheck._count.contacts === 2) {
      console.log('✅ SUCESSO! A importação funcionou pelo script.');
    } else {
      console.log('❌ FALHA! Contatos não foram vinculados.');
    }
  } else {
    console.log('❌ FALHA! Lista não encontrada.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
