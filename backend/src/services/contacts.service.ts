import { prisma } from '../lib/prisma';
import { Platform } from '@prisma/client';

interface CreateContactInput {
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  platform: Platform;
  platformId: string;
  tags?: string[];
  customFields?: any;
}

interface UpdateContactInput {
  name?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  tags?: string[];
  customFields?: any;
}

interface ContactFilters {
  search?: string;
  tags?: string[];
  platform?: Platform;
}

export class ContactsService {
  async listContacts(
    page: number = 1,
    limit: number = 20,
    filters?: ContactFilters
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }
    
    if (filters?.platform) {
      where.platform = filters.platform;
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          conversations: {
            take: 1,
            orderBy: { updatedAt: 'desc' },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getContactById(id: string) {
    return prisma.contact.findUnique({
      where: { id },
      include: {
        conversations: {
          include: {
            messages: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        lists: true,
      },
    });
  }

  async createContact(data: CreateContactInput) {
    return prisma.contact.create({
      data,
    });
  }

  async updateContact(id: string, data: UpdateContactInput) {
    return prisma.contact.update({
      where: { id },
      data,
    });
  }

  async deleteContact(id: string) {
    return prisma.contact.delete({
      where: { id },
    });
  }

  async bulkDeleteContacts(ids: string[]) {
    return prisma.contact.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async importContacts(contacts: CreateContactInput[], listId?: string) {
    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const contactData of contacts) {
      try {
        const existing = await prisma.contact.findUnique({
          where: {
            platform_platformId: {
              platform: contactData.platform,
              platformId: contactData.platformId,
            },
          },
        });

        if (existing) {
          // Update existing contact and connect to list if provided
          await prisma.contact.update({
            where: { id: existing.id },
            data: {
              name: contactData.name,
              phone: contactData.phone,
              email: contactData.email,
              // Add new tags to existing ones
              tags: {
                 set: [...new Set([...(existing.tags || []), ...(contactData.tags || [])])]
              },
              // Connect to list if listId is provided
              lists: listId ? {
                connect: { id: listId }
              } : undefined
            },
          });
          results.updated++;
        } else {
          // Create new contact and connect to list if provided
          await prisma.contact.create({
            data: {
              ...contactData,
              // Connect to list if listId is provided
              lists: listId ? {
                connect: { id: listId }
              } : undefined
            },
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push(`Error importing ${contactData.name}: ${error.message}`);
        console.error(`Error importing contact:`, error);
      }
    }

    return results;
  }
}

export const contactsService = new ContactsService();
