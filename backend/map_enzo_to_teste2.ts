
import { prisma } from './src/lib/prisma';

async function mapEnzoToTeste2() {
  try {
    // Find integration named 'teste2'
    const integration = await prisma.integration.findFirst({
        where: { name: 'teste2' }
    });

    if (integration) {
        console.log('Found integration:', integration.name);
        const newConfig = { ...(integration.config as object), instanceName: 'enzo' };
        
        await prisma.integration.update({
            where: { id: integration.id },
            data: { config: newConfig }
        });
        
        console.log('✅ Updated config.instanceName to "enzo" for integration "teste2".');
        console.log('Now messages from "enzo" will trigger this integration agent.');
    } else {
        console.log('Integration "teste2" not found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

mapEnzoToTeste2();
