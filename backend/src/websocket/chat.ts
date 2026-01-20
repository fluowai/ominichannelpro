import { FastifyInstance } from 'fastify';

console.log('[DEBUG_LOAD] chat.ts module loaded'); 

export async function chatWebSocket(fastify: FastifyInstance) {
  console.log('[DEBUG_LOAD] chatWebSocket plugin registering'); 

  fastify.get('/ws/chat', { websocket: true }, (connection, req) => {
    console.log('[DEBUG_CONN] WebSocket connection received!');
    
    connection.socket.on('message', (message) => {
       console.log('[DEBUG_MSG] Message received:', message.toString());
       connection.socket.send(JSON.stringify({ type: 'new_message', message: { text: 'ECHO TEST: ' + message.toString() } }));
    });
    
    connection.socket.on('error', (e) => console.error('[DEBUG_ERR] Socket error:', e));
    connection.socket.on('close', () => console.log('[DEBUG_CLOSE] Connection closed'));
  });
}
