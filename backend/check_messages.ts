
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMessages() {
  try {
    const messages = await prisma.message.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        conversation: {
            include: {
                contact: true
            }
        }
      }
    });

    console.log(JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMessages();
