import { prisma } from '../lib/prisma';

interface CreateKanbanColumnInput {
  title: string;
  order: number;
  color?: string;
  organizationId: string;
}

interface CreateKanbanCardInput {
  title: string;
  description?: string;
  value?: number;
  order: number;
  columnId: string;
  contactId?: string;
}

export class KanbanService {
  async getKanbanBoard(organizationId: string) {
    const columns = await prisma.kanbanColumn.findMany({
      where: { organizationId },
      include: {
        cards: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return columns;
  }

  async createColumn(data: CreateKanbanColumnInput) {
    return prisma.kanbanColumn.create({
      data,
    });
  }

  async updateColumn(id: string, data: Partial<CreateKanbanColumnInput>) {
    return prisma.kanbanColumn.update({
      where: { id },
      data,
    });
  }

  async deleteColumn(id: string) {
    // Delete all cards in the column first
    await prisma.kanbanCard.deleteMany({
      where: { columnId: id },
    });

    return prisma.kanbanColumn.delete({
      where: { id },
    });
  }

  async createCard(data: CreateKanbanCardInput) {
    return prisma.kanbanCard.create({
      data,
      include: {
        contact: true,
      },
    });
  }

  async updateCard(id: string, data: Partial<CreateKanbanCardInput>) {
    return prisma.kanbanCard.update({
      where: { id },
      data,
      include: {
        contact: true,
      },
    });
  }

  async moveCard(cardId: string, newColumnId: string, newOrder: number) {
    return prisma.kanbanCard.update({
      where: { id: cardId },
      data: {
        columnId: newColumnId,
        order: newOrder,
      },
    });
  }

  async deleteCard(id: string) {
    return prisma.kanbanCard.delete({
      where: { id },
    });
  }

  async initializeDefaultColumns(organizationId: string) {
    const defaultColumns = [
      { title: 'Novo Lead', order: 0, color: '#3b82f6' },
      { title: 'Contato Inicial', order: 1, color: '#8b5cf6' },
      { title: 'Qualificado', order: 2, color: '#f59e0b' },
      { title: 'Proposta Enviada', order: 3, color: '#10b981' },
      { title: 'Negociação', order: 4, color: '#ef4444' },
      { title: 'Fechado', order: 5, color: '#059669' },
    ];

    const columns = await Promise.all(
      defaultColumns.map(col =>
        prisma.kanbanColumn.create({
          data: {
            ...col,
            organizationId,
          },
        })
      )
    );

    return columns;
  }
}

export const kanbanService = new KanbanService();
