
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function update() {
  await prisma.integration.update({
    where: { id: 'cmkiwo6oj0000w4xudwi37nut' },
    data: { 
      instanceUrl: 'https://wooapi.boow.com.br',
      config: { sessionId: 'pauloargolo', userToken: 'fluow_test_deiag' }
    }
  });
  console.log('Updated integration to use working test token');
}
update().then(() => process.exit(0));
