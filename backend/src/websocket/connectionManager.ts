
import { WebSocket } from 'ws';



export class ConnectionManager {
  private static instance: ConnectionManager;
  private connections: Set<WebSocket> = new Set();

  private constructor() {
    console.log('[CONN_MANAGER] 🟢 INSTANCE CREATED');
  }

  public static getInstance(): ConnectionManager {
    if (!(global as any)._connectionManager) {
      (global as any)._connectionManager = new ConnectionManager();
    }
    return (global as any)._connectionManager;
  }

  public addConnection(ws: any) {
    if (!ws) return;
    this.connections.add(ws);
    console.log(`[WS Manager] Access added. Total: ${this.connections.size}`);
    import('fs').then(fs => fs.appendFileSync('singleton_debug.log', `[${new Date().toISOString()}] Connection ADDED. Total: ${this.connections.size}\n`));
  }

  public removeConnection(ws: any) {
    this.connections.delete(ws);
    console.log(`[WS Manager] Connection removed. Total: ${this.connections.size}`);
    import('fs').then(fs => fs.appendFileSync('singleton_debug.log', `[${new Date().toISOString()}] Connection REMOVED. Total: ${this.connections.size}\n`));
  }

  public broadcast(message: any) {
    try {
      console.log(`[WS Manager] Broadcasting...`);
      import('fs').then(fs => fs.appendFileSync('singleton_debug.log', `[${new Date().toISOString()}] BROADCAST Start. Target Clients: ${this.connections.size}\n`));
      
      const data = JSON.stringify(message);
      let sentCount = 0;
      
      // Safety: Use safe iteration
      const clients = Array.from(this.connections);
      clients.forEach(client => {
        try {
          // Check if client is valid and open (OPEN = 1)
          if (client && client.readyState === 1) { 
            client.send(data);
            sentCount++;
          }
        } catch (err) {
            console.error('[WS Manager] Error sending to client:', err);
            this.connections.delete(client); // Remove dead client
        }
      });
      
      import('fs').then(fs => fs.appendFileSync('singleton_debug.log', `[${new Date().toISOString()}] BROADCAST Done. Sent to: ${sentCount}\n`));
    } catch (criticalError) {
        console.error('[WS Manager] Critical Broadcast Error:', criticalError);
    }
  }
}

export const connectionManager = ConnectionManager.getInstance();
