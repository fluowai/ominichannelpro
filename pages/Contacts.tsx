import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  Upload,
  Filter,
  Tag,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../utils/auth';

const API_URL = '/';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  platform: string;
  platformId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    platform: 'WHATSAPP',
    platformId: '',
    tags: [] as string[],
  });

  useEffect(() => {
    loadContacts();
  }, [page, searchQuery]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const user = getCurrentUser();
      
      const response = await api.get(`${API_URL}contacts`, {
        params: { 
          page, 
          limit: 20, 
          search: searchQuery,
          organizationId: user?.organizationId 
        },
      });
      
      setContacts(response.data.contacts);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error: any) {
      console.error('Load contacts error:', error);
      if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
      } else {
        toast.error('Erro ao carregar contatos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async () => {
    try {
      const user = getCurrentUser();
      const dataToSave = { ...formData, organizationId: user?.organizationId };
      
      if (editingContact) {
        await api.put(`${API_URL}contacts/${editingContact.id}`, dataToSave);
        toast.success('Contato atualizado com sucesso!');
      } else {
        await api.post(`${API_URL}contacts`, dataToSave);
        toast.success('Contato criado com sucesso!');
      }
      
      setShowModal(false);
      setEditingContact(null);
      resetForm();
      loadContacts();
    } catch (error) {
      toast.error('Erro ao salvar contato');
      console.error(error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;
    
    try {
      await api.delete(`${API_URL}contacts/${id}`);
      toast.success('Contato excluído com sucesso!');
      loadContacts();
    } catch (error) {
      toast.error('Erro ao excluir contato');
      console.error(error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedContacts.length} contatos?`)) return;
    
    try {
      await api.post(`${API_URL}contacts/bulk-delete`, { ids: selectedContacts });
      toast.success('Contatos excluídos com sucesso!');
      setSelectedContacts([]);
      loadContacts();
    } catch (error) {
      toast.error('Erro ao excluir contatos');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      platform: 'WHATSAPP',
      platformId: '',
      tags: [],
    });
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone || '',
      email: contact.email || '',
      platform: contact.platform,
      platformId: contact.platformId,
      tags: contact.tags,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingContact(null);
    resetForm();
    setShowModal(true);
  };

  const exportToCSV = () => {
    try {
      // Prepare CSV data
      const csvHeaders = ['Nome', 'Telefone', 'Email', 'Plataforma', 'Tags', 'Data de Criação'];
      const csvRows = contacts.map(contact => [
        contact.name,
        contact.phone || '',
        contact.email || '',
        contact.platform,
        contact.tags.join(', '),
        new Date(contact.createdAt).toLocaleDateString('pt-BR')
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `contatos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${contacts.length} contatos exportados com sucesso!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar contatos');
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Contatos</h1>
            <p className="text-slate-500">Gerencie sua lista telefônica completa</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              disabled={contacts.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              Exportar CSV
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Novo Contato
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-100 outline-none"
            />
          </div>
          
          {selectedContacts.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all"
            >
              <Trash2 size={20} />
              Excluir ({selectedContacts.length})
            </button>
          )}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedContacts.length === contacts.length && contacts.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedContacts(contacts.map(c => c.id));
                    } else {
                      setSelectedContacts([]);
                    }
                  }}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Telefone</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Plataforma</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tags</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  Carregando...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  Nenhum contato encontrado
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContacts([...selectedContacts, contact.id]);
                        } else {
                          setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                        }
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                        {contact.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{contact.phone || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{contact.email || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      {contact.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">
                          {tag}
                        </span>
                      ))}
                      {contact.tags.length > 2 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">
                          +{contact.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(contact)}
                        className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-slate-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingContact ? 'Editar Contato' : 'Novo Contato'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                    placeholder="Nome do contato"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                      placeholder="+55 11 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Plataforma *</label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="MESSENGER">Messenger</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ID da Plataforma *</label>
                    <input
                      type="text"
                      value={formData.platformId}
                      onChange={(e) => setFormData({ ...formData, platformId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                      placeholder="ID único"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingContact(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveContact}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl"
                >
                  {editingContact ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
