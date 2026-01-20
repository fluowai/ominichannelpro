
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  const newInt = await prisma.integration.create({
    data: {
      name: 'AutoTest',
      type: 'WUZAPI',
      instanceUrl: 'https://wooapi.boow.com.br',
      config: { sessionId: 'autotest' }
    }
  });
  console.log('Created ID:', newInt.id);
}
test().then(() => process.exit(0));
