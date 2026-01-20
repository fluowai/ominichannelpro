
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function fix() {
  await prisma.integration.update({
    where: { id: 'cmkiugtc50000qrioxbz6fc4e' },
    data: { 
      config: { sessionId: 'pauloa', userToken: 'pauloa_user_o1arpxda' }
    }
  });
  console.log('Fixed pauloa');
}
fix().then(() => process.exit(0));
