import { FastifyInstance } from 'fastify';
import { contactsService } from '../services/contacts.service';
import { Platform } from '@prisma/client';

export async function contactsRoutes(app: FastifyInstance) {
  // List contacts with filters and pagination
  app.get('/', async (request, reply) => {
    const { page = '1', limit = '20', search, tags, platform } = request.query as any;
    
    const filters: any = {};
    if (search) filters.search = search;
    if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
    if (platform) filters.platform = platform as Platform;

    const result = await contactsService.listContacts(
      parseInt(page),
      parseInt(limit),
      filters
    );

    return reply.send(result);
  });

  // Get contact by ID
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const contact = await contactsService.getContactById(id);
    
    if (!contact) {
      return reply.status(404).send({ error: 'Contact not found' });
    }

    return reply.send(contact);
  });

  // Create new contact
  app.post('/', async (request, reply) => {
    const data = request.body as any;
    
    const contact = await contactsService.createContact(data);
    
    return reply.status(201).send(contact);
  });

  // Update contact
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    
    const contact = await contactsService.updateContact(id, data);
    
    return reply.send(contact);
  });

  // Delete contact
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    await contactsService.deleteContact(id);
    
    return reply.status(204).send();
  });

  // Bulk delete contacts
  app.post('/bulk-delete', async (request, reply) => {
    const { ids } = request.body as { ids: string[] };
    
    await contactsService.bulkDeleteContacts(ids);
    
    return reply.status(204).send();
  });

  // Import contacts
  app.post('/import', async (request, reply) => {
    const { contacts, listId } = request.body as any;
    
    console.log(`[DEBUG IMPORT] Received request to import ${contacts?.length} contacts to listId: '${listId}'`);
    console.log(`[DEBUG IMPORT] First contact sample:`, contacts?.[0]);

    if (!listId) {
        console.warn('[DEBUG IMPORT] WARNING: listId IS MISSING OR EMPTY!');
    }

    const result = await contactsService.importContacts(contacts, listId);
    
    return reply.send(result);
  });
}
