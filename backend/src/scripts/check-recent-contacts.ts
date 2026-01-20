import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkContacts() {
  console.log('--- RECENT CONTACTS ---');
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    for (const contact of contacts) {
      console.log(`\nID: ${contact.id}`);
      console.log(`Name: ${contact.name}`);
      console.log(`Phone: ${contact.phone}`);
      console.log(`Platform ID: ${contact.platformId}`);
    }
  } catch (error) {
    console.error('Error checking contacts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContacts();
