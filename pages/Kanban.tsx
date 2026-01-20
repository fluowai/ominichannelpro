import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2,
  User,
  DollarSign,
  Phone,
  Mail
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:3333/api';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  value?: number;
  order: number;
  columnId: string;
  contact?: Contact;
}

interface KanbanColumn {
  id: string;
  title: string;
  order: number;
  color: string;
  cards: KanbanCard[];
}

function Card({ card }: { card: KanbanCard }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3"
    >
      <h3 className="font-bold text-slate-900 mb-2">{card.title}</h3>
      
      {card.description && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{card.description}</p>
      )}
      
      {card.contact && (
        <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
          <User size={14} />
          <span>{card.contact.name}</span>
        </div>
      )}
      
      {card.value && (
        <div className="flex items-center gap-2 text-sm font-bold text-green-600">
          <DollarSign size={14} />
          <span>R$ {card.value.toLocaleString('pt-BR')}</span>
        </div>
      )}
    </div>
  );
}

function Column({ column, onAddCard }: { column: KanbanColumn; onAddCard: (columnId: string) => void }) {
  return (
    <div className="bg-slate-50 rounded-3xl p-4 min-w-[320px] max-w-[320px] flex flex-col">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: column.color }}
          />
          <h2 className="font-bold text-slate-900">{column.title}</h2>
          <span className="px-2 py-1 bg-white rounded-lg text-xs font-bold text-slate-600">
            {column.cards.length}
          </span>
        </div>
        <button className="p-2 hover:bg-white rounded-lg transition-all">
          <MoreVertical size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
        <SortableContext items={column.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>

      {/* Add Card Button */}
      <button
        onClick={() => onAddCard(column.id)}
        className="mt-4 w-full py-3 bg-white hover:bg-slate-100 rounded-2xl text-slate-600 font-medium transition-all flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Adicionar Card
      </button>
    </div>
  );
}

export default function Kanban() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadKanbanBoard();
  }, []);

  const loadKanbanBoard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!userStr) {
        toast.error('Usuário não autenticado');
        setLoading(false);
        return;
      }
      
      const user = JSON.parse(userStr);
      
      // If user doesn't have organizationId, use a default or create one
      const organizationId = user.organizationId || 'default';
      
      const response = await axios.get(`${API_URL}/kanban`, {
        params: { organizationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.length === 0) {
        // Initialize default columns if none exist
        await initializeBoard(organizationId);
      } else {
        setColumns(response.data);
      }
    } catch (error: any) {
      console.error('Kanban load error:', error);
      
      // Check if it's a 404 or empty response - initialize board
      if (error.response?.status === 404 || error.response?.data?.length === 0) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const organizationId = user.organizationId || 'default';
          await initializeBoard(organizationId);
        }
      } else {
        toast.error('Erro ao carregar quadro Kanban');
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeBoard = async (orgId?: string) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!userStr) {
        return;
      }
      
      const user = JSON.parse(userStr);
      const organizationId = orgId || user.organizationId || 'default';
      
      await axios.post(
        `${API_URL}/kanban/initialize`,
        { organizationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Reload board after initialization
      const response = await axios.get(`${API_URL}/kanban`, {
        params: { organizationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setColumns(response.data);
    } catch (error) {
      console.error('Erro ao inicializar quadro:', error);
      toast.error('Erro ao inicializar quadro Kanban');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = columns
      .flatMap(col => col.cards)
      .find(c => c.id === active.id);
    
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveCard(null);
      return;
    }

    const activeCard = columns
      .flatMap(col => col.cards)
      .find(c => c.id === active.id);
    
    if (!activeCard) {
      setActiveCard(null);
      return;
    }

    // Find target column
    let targetColumnId = activeCard.columnId;
    let targetOrder = activeCard.order;

    // Check if dropped on another card
    const overCard = columns
      .flatMap(col => col.cards)
      .find(c => c.id === over.id);
    
    if (overCard) {
      targetColumnId = overCard.columnId;
      targetOrder = overCard.order;
    } else {
      // Dropped on column
      const overColumn = columns.find(col => col.id === over.id);
      if (overColumn) {
        targetColumnId = overColumn.id;
        targetOrder = overColumn.cards.length;
      }
    }

    // Update locally
    const newColumns = columns.map(col => {
      if (col.id === activeCard.columnId) {
        return {
          ...col,
          cards: col.cards.filter(c => c.id !== activeCard.id),
        };
      }
      if (col.id === targetColumnId) {
        const newCards = [...col.cards];
        newCards.splice(targetOrder, 0, { ...activeCard, columnId: targetColumnId, order: targetOrder });
        return {
          ...col,
          cards: newCards.map((c, i) => ({ ...c, order: i })),
        };
      }
      return col;
    });

    setColumns(newColumns);
    setActiveCard(null);

    // Update on server
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/kanban/cards/${activeCard.id}/move`,
        { columnId: targetColumnId, order: targetOrder },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      toast.error('Erro ao mover card');
      console.error(error);
      loadKanbanBoard(); // Reload to sync
    }
  };

  const handleAddCard = (columnId: string) => {
    setSelectedColumnId(columnId);
    setShowModal(true);
  };

  const handleSaveCard = async () => {
    if (!formData.title.trim()) {
      toast.error('Digite um título para o card');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const column = columns.find(c => c.id === selectedColumnId);
      
      await axios.post(
        `${API_URL}/kanban/cards`,
        {
          title: formData.title,
          description: formData.description,
          value: formData.value ? parseFloat(formData.value) : undefined,
          columnId: selectedColumnId,
          order: column?.cards.length || 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Card criado com sucesso!');
      setShowModal(false);
      setFormData({ title: '', description: '', value: '' });
      loadKanbanBoard();
    } catch (error) {
      toast.error('Erro ao criar card');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando quadro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Kanban - Pipeline de Vendas</h1>
        <p className="text-slate-500">Gerencie seus leads e oportunidades visualmente</p>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 pb-4 min-h-full">
            {columns.map((column) => (
              <Column key={column.id} column={column} onAddCard={handleAddCard} />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? <Card card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Card Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Novo Card</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Título *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                    placeholder="Nome do lead ou oportunidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                    rows={3}
                    placeholder="Detalhes sobre o lead..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                    placeholder="0,00"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ title: '', description: '', value: '' });
                  }}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCard}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Criar Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
