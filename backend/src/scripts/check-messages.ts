import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkMessages() {
  const conversationId = 'cmkljia3900044licxgamu1mo';
  console.log(`--- MESSAGES FOR CONVERSATION ${conversationId} ---`);
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        conversation: {
          select: {
            integrationId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    for (const msg of messages) {
      console.log(`[${msg.createdAt.toISOString()}] ${msg.sender} (Int: ${msg.conversation.integrationId}): ${msg.text}`);
    }
  } catch (error) {
    console.error('Error checking messages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMessages();
