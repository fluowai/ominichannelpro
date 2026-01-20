
import { WebSocketServer, WebSocket } from 'ws';
import { FastifyInstance } from 'fastify';
import { connectionManager } from './connectionManager.js';

export function setupManualWebSocket(fastify: FastifyInstance) {
  const wss = new WebSocketServer({ server: fastify.server, path: '/ws/chat' });

  wss.on('connection', (ws, req) => {
    try {
      // Parse Query Params
      const url = new URL(req.url || '', 'http://localhost');
      const userId = url.searchParams.get('userId') || 'anonymous';

      console.log(`[MANUAL_WS] Connected: ${userId}`);

      // REGISTER WITH MANAGER
      connectionManager.addConnection(ws);
      
      // KEEP-ALIVE: Ping every 30s
      (ws as any).isAlive = true;
      ws.on('pong', () => { (ws as any).isAlive = true; });

      ws.on('message', (message) => {
        try {
          const msgStr = message.toString();
          // Heartbeat or simple echo check
          if (msgStr === 'ping') {
              ws.send('pong');
              return;
          }

          const data = JSON.parse(msgStr);
          if (data.type === 'typing') {
             // Broadcast typing? 
             // connectionManager.broadcast(data);
          }
        } catch (e) {
          console.error('[MANUAL_WS] Message handling error:', e);
        }
      });

      ws.on('close', () => {
        console.log(`[MANUAL_WS] Disconnected: ${userId}`);
        connectionManager.removeConnection(ws);
      });

      ws.on('error', (err) => {
        console.error(`[MANUAL_WS] Error ${userId}:`, err);
        connectionManager.removeConnection(ws);
      });

    } catch (err) {
      console.error('[MANUAL_WS] Handshake error:', err);
      ws.close();
    }
  });
  
  // Heartbeat Interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate();
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('[MANUAL_WS] Setup complete on /ws/chat');
}
