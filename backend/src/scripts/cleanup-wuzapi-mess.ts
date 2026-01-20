import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function cleanup() {
  console.log('--- CLEANUP START ---');
  
  try {
    // 1. Delete redundant DISCONNECTED Wuzapi integrations
    const deletedInts = await prisma.integration.deleteMany({
      where: {
        type: 'WUZAPI',
        status: 'DISCONNECTED',
        name: { contains: 'WhatsApp' } // Specific target
      }
    });
    console.log(`Deleted ${deletedInts.count} redundant DISCONNECTED integrations.`);

    // 2. Fix corrupted contacts (those with > 13 digits)
    const corruptedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { phone: { gt: '9999999999999' } },
          { platformId: { contains: ':' } }
        ]
      }
    });

    console.log(`Found ${corruptedContacts.length} corrupted contacts.`);

    for (const contact of corruptedContacts) {
      const oldPhone = contact.phone;
      const oldPlatformId = contact.platformId;
      
      // Fix phone: remove everything after the 13th digit or split by :
      let cleanPhone = oldPhone.split(':')[0].substring(0, 13);
      let cleanPlatformId = oldPlatformId.split(':')[0];
      if (!cleanPlatformId.includes('@')) cleanPlatformId += '@s.whatsapp.net';

      console.log(`Fixing contact ${contact.name}: ${oldPhone} -> ${cleanPhone}`);
      
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          phone: cleanPhone,
          platformId: cleanPlatformId
        }
      });
    }

    console.log('--- CLEANUP FINISHED ---');
  } catch (error) {
    console.error('Cleanup Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
