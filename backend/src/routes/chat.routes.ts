
import { FastifyInstance } from 'fastify';
import { connectionManager } from '../websocket/connectionManager.js';

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.get('/ws/chat', { websocket: true }, (connection: any, req: any) => {
    try {
      const socket = connection.socket;
      
      // Query Params (handled by Fastify automatically in req.query)
      const query = req.query as { userId?: string, token?: string };
      const userId = query.userId || 'anonymous';
      const token = query.token;

      console.log(`[FASTIFY_WS] ========== NEW CONNECTION ATTEMPT ==========`);
      console.log(`[FASTIFY_WS] UserID: ${userId}`);
      console.log(`[FASTIFY_WS] Token present: ${!!token}`);
      console.log(`[FASTIFY_WS] Headers:`, req.headers);
      console.log(`[FASTIFY_WS] Remote Address: ${req.socket.remoteAddress}`);

      // REGISTER WITH MANAGER
      connectionManager.addConnection(socket);
      console.log(`[FASTIFY_WS] Connection registered successfully`);
      
      // KEEP-ALIVE
      (socket as any).isAlive = true;
      socket.on('pong', () => { (socket as any).isAlive = true; });

      socket.on('message', (message: any) => {
        try {
          const msgStr = message.toString();
          if (msgStr === 'ping') {
              socket.send('pong');
              return;
          }

          // Handle generic messages if needed
          // const data = JSON.parse(msgStr);
        } catch (e) {
          console.error('[FASTIFY_WS] Message handling error:', e);
        }
      });

      socket.on('close', () => {
        console.log(`[FASTIFY_WS] Disconnected: ${userId}`);
        connectionManager.removeConnection(socket);
      });

      socket.on('error', (err: any) => {
        console.error(`[FASTIFY_WS] Error ${userId}:`, err);
        connectionManager.removeConnection(socket);
      });

    } catch (err) {
      console.error('[FASTIFY_WS] Handshake error:', err);
      if (connection && connection.socket) {
        connection.socket.close();
      }
    }
  });

  // Heartbeat Interval (Global)
  // Note: ideally should be managed globally, but doing it here locally for the active connections in this route instance
  const interval = setInterval(() => {
    fastify.websocketServer.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate();
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  fastify.addHook('onClose', (instance, done) => {
    clearInterval(interval);
    done();
  });
}
