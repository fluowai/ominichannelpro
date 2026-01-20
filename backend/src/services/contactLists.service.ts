import { prisma } from '../lib/prisma';

interface CreateContactListInput {
  name: string;
  description?: string;
  organizationId: string;
}

export class ContactListsService {
  async listContactLists(organizationId: string) {
    return prisma.contactList.findMany({
      where: { organizationId },
      include: {
        contacts: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
          },
        },
        _count: {
          select: { contacts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContactListById(id: string) {
    return prisma.contactList.findUnique({
      where: { id },
      include: {
        contacts: true,
        organization: true,
      },
    });
  }

  async createContactList(data: CreateContactListInput) {
    return prisma.contactList.create({
      data,
    });
  }

  async updateContactList(id: string, data: Partial<CreateContactListInput>) {
    return prisma.contactList.update({
      where: { id },
      data,
    });
  }

  async deleteContactList(id: string) {
    return prisma.contactList.delete({
      where: { id },
    });
  }

  async addContactsToList(listId: string, contactIds: string[]) {
    return prisma.contactList.update({
      where: { id: listId },
      data: {
        contacts: {
          connect: contactIds.map(id => ({ id })),
        },
      },
    });
  }

  async removeContactsFromList(listId: string, contactIds: string[]) {
    return prisma.contactList.update({
      where: { id: listId },
      data: {
        contacts: {
          disconnect: contactIds.map(id => ({ id })),
        },
      },
    });
  }
}

export const contactListsService = new ContactListsService();
