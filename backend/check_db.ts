
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CHECKING CONTACT LISTS ---');
  
  const lists = await prisma.contactList.findMany({
    include: {
      _count: {
        select: { contacts: true }
      },
      contacts: {
        take: 5
      }
    }
  });

  if (lists.length === 0) {
    console.log('No contact lists found.');
  } else {
    lists.forEach(list => {
      console.log(`\nList: ${list.name} (ID: ${list.id})`);
      console.log(`Description: ${list.description}`);
      console.log(`Organization ID: ${list.organizationId}`);
      console.log(`Total Contacts: ${list._count.contacts}`);
      
      if (list.contacts.length > 0) {
        console.log('Sample Contacts:');
        list.contacts.forEach(c => {
          console.log(`  - ${c.name} (${c.phone}) [Tags: ${c.tags.join(', ')}]`);
        });
      } else {
        console.log('  No contacts linked to this list.');
      }
    });
  }

  console.log('\n--- CHECKING UNLINKED CONTACTS (Sample) ---');
  const unlinkedContacts = await prisma.contact.findMany({
    where: {
      lists: {
        none: {}
      }
    },
    take: 5
  });
  
  console.log(`Found ${unlinkedContacts.length} unlinked contacts (showing max 5):`);
  unlinkedContacts.forEach(c => {
    console.log(`  - ${c.name} (${c.phone})`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
