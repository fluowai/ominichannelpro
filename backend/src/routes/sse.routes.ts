import { FastifyInstance, FastifyReply } from 'fastify';

// Store active SSE connections
const sseClients = new Set<FastifyReply>();

export async function sseRoutes(fastify: FastifyInstance) {
  // SSE endpoint for real-time updates
  fastify.get('/events', async (request, reply) => {
    console.log('[SSE] New connection attempt from:', request.socket.remoteAddress);

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Add client to active connections
    sseClients.add(reply);
    console.log(`[SSE] Client connected. Total: ${sseClients.size}`);

    // Send initial connection message
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Keep-alive ping every 15s
    const keepAlive = setInterval(() => {
      try {
        reply.raw.write(`: keep-alive\n\n`);
      } catch (err) {
        clearInterval(keepAlive);
        sseClients.delete(reply);
      }
    }, 15000);

    // Handle client disconnect
    request.raw.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(reply);
      console.log(`[SSE] Client disconnected. Total: ${sseClients.size}`);
    });

    request.raw.on('error', (err) => {
      console.error('[SSE] Client error:', err.message);
      clearInterval(keepAlive);
      sseClients.delete(reply);
    });
  });
}

// Broadcast function to send events to all connected clients
export function broadcastSSE(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  console.log(`[SSE] Broadcasting to ${sseClients.size} clients`);
  
  for (const client of sseClients) {
    try {
      client.raw.write(message);
    } catch (err) {
      console.error('[SSE] Error sending to client:', err);
      sseClients.delete(client);
    }
  }
}
