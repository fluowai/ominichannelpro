import { FastifyInstance } from 'fastify';
import { contactListsService } from '../services/contactLists.service';

export async function contactListsRoutes(app: FastifyInstance) {
  // List all contact lists for an organization
  app.get('/', async (request, reply) => {
    try {
      const { organizationId } = request.query as { organizationId: string };
      
      const lists = await contactListsService.listContactLists(organizationId);
      
      return reply.send(lists);
    } catch (error) {
      console.error('Error listing contact lists:', error);
      return reply.status(500).send({ error: 'Failed to list contact lists' });
    }
  });

  // Get contact list by ID
  app.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const list = await contactListsService.getContactListById(id);
      
      if (!list) {
        return reply.status(404).send({ error: 'Contact list not found' });
      }

      return reply.send(list);
    } catch (error) {
      console.error('Error getting contact list:', error);
      return reply.status(500).send({ error: 'Failed to get contact list' });
    }
  });

  // Get contacts in a specific list
  app.get('/:id/contacts', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const list = await contactListsService.getContactListById(id);
      
      if (!list) {
        return reply.status(404).send({ error: 'Contact list not found' });
      }

      return reply.send({ contacts: list.contacts });
    } catch (error) {
      console.error('Error getting list contacts:', error);
      return reply.status(500).send({ error: 'Failed to get list contacts' });
    }
  });

  // Create new contact list
  app.post('/', async (request, reply) => {
    try {
      const data = request.body as any;
      
      if (!data.name || !data.organizationId) {
        return reply.status(400).send({ error: 'Name and organizationId are required' });
      }
      
      const list = await contactListsService.createContactList(data);
      
      return reply.status(201).send(list);
    } catch (error: any) {
      console.error('Error creating contact list:', error);
      return reply.status(500).send({ 
        error: 'Failed to create contact list',
        details: error.message 
      });
    }
  });

  // Update contact list
  app.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;
      
      const list = await contactListsService.updateContactList(id, data);
      
      return reply.send(list);
    } catch (error) {
      console.error('Error updating contact list:', error);
      return reply.status(500).send({ error: 'Failed to update contact list' });
    }
  });

  // Delete contact list
  app.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      await contactListsService.deleteContactList(id);
      
      return reply.status(204).send();
    } catch (error) {
      console.error('Error deleting contact list:', error);
      return reply.status(500).send({ error: 'Failed to delete contact list' });
    }
  });

  // Add contacts to list
  app.post('/:id/contacts', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { contactIds } = request.body as { contactIds: string[] };
      
      const list = await contactListsService.addContactsToList(id, contactIds);
      
      return reply.send(list);
    } catch (error) {
      console.error('Error adding contacts to list:', error);
      return reply.status(500).send({ error: 'Failed to add contacts to list' });
    }
  });

  // Remove contacts from list
  app.delete('/:id/contacts', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { contactIds } = request.body as { contactIds: string[] };
      
      const list = await contactListsService.removeContactsFromList(id, contactIds);
      
      return reply.send(list);
    } catch (error) {
      console.error('Error removing contacts from list:', error);
      return reply.status(500).send({ error: 'Failed to remove contacts from list' });
    }
  });
}
