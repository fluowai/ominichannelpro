import { FastifyInstance } from 'fastify';
import { kanbanService } from '../services/kanban.service';

export async function kanbanRoutes(app: FastifyInstance) {
  // Get kanban board for organization
  app.get('/', async (request, reply) => {
    const { organizationId } = request.query as { organizationId: string };
    
    const board = await kanbanService.getKanbanBoard(organizationId);
    
    return reply.send(board);
  });

  // Initialize default columns for organization
  app.post('/initialize', async (request, reply) => {
    const { organizationId } = request.body as { organizationId: string };
    
    const columns = await kanbanService.initializeDefaultColumns(organizationId);
    
    return reply.status(201).send(columns);
  });

  // Create column
  app.post('/columns', async (request, reply) => {
    const data = request.body as any;
    
    const column = await kanbanService.createColumn(data);
    
    return reply.status(201).send(column);
  });

  // Update column
  app.put('/columns/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    
    const column = await kanbanService.updateColumn(id, data);
    
    return reply.send(column);
  });

  // Delete column
  app.delete('/columns/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    await kanbanService.deleteColumn(id);
    
    return reply.status(204).send();
  });

  // Create card
  app.post('/cards', async (request, reply) => {
    const data = request.body as any;
    
    const card = await kanbanService.createCard(data);
    
    return reply.status(201).send(card);
  });

  // Update card
  app.put('/cards/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    
    const card = await kanbanService.updateCard(id, data);
    
    return reply.send(card);
  });

  // Move card (drag and drop)
  app.put('/cards/:id/move', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { columnId, order } = request.body as { columnId: string; order: number };
    
    const card = await kanbanService.moveCard(id, columnId, order);
    
    return reply.send(card);
  });

  // Delete card
  app.delete('/cards/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    await kanbanService.deleteCard(id);
    
    return reply.status(204).send();
  });
}
