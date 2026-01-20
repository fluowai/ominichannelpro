
import React, { useEffect, useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Calendar, 
  Users, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Trash2,
  X
} from 'lucide-react';
import { useCampaignsStore } from '../store/campaignsStore';
import toast from 'react-hot-toast';

const Broadcast = () => {
  const { campaigns, isLoading, fetchCampaigns, createCampaign, deleteCampaign } = useCampaignsStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    platform: 'WHATSAPP',
    message: '',
    audience: 'ALL_CONTACTS',
    scheduledAt: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCampaign({
        ...formData,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null
      });
      toast.success('Campanha criada com sucesso!');
      setShowModal(false);
      setFormData({ name: '', platform: 'WHATSAPP', message: '', audience: 'ALL_CONTACTS', scheduledAt: '' });
    } catch (error) {
      toast.error('Erro ao criar campanha');
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Tem certeza?')) {
      try {
        await deleteCampaign(id);
        toast.success('Campanha removida!');
      } catch (error) {
        toast.error('Erro ao remover campanha');
      }
    }
  };

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-500',
    SCHEDULED: 'bg-blue-100 text-blue-600',
    SENDING: 'bg-orange-100 text-orange-600',
    COMPLETED: 'bg-green-100 text-green-600',
    FAILED: 'bg-red-100 text-red-600'
  } as const;

  const statusLabels = {
    DRAFT: 'Rascunho',
    SCHEDULED: 'Agendada',
    SENDING: 'Enviando',
    COMPLETED: 'Concluída',
    FAILED: 'Falhou'
  } as const;

  return (
    <div className="p-10 font-['Poppins'] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Broadcast</h1>
          <p className="text-slate-500 font-medium">Gerencie suas campanhas de envio em massa.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 active:scale-95"
        >
          <Plus size={24} />
          Nova Campanha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {isLoading && campaigns.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-400">Carregando campanhas...</div>
        ) : campaigns.length === 0 ? (
           <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[2rem]">
             <Megaphone size={64} className="text-slate-300 mb-6" />
             <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhuma campanha criada</h3>
             <p className="text-slate-500">Crie sua primeira campanha para engajar seus clientes.</p>
           </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white p-8 rounded-[2rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${statusColors[campaign.status as keyof typeof statusColors]}`}>
                  <Megaphone size={24} />
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${statusColors[campaign.status as keyof typeof statusColors]}`}>
                    {statusLabels[campaign.status as keyof typeof statusLabels]}
                  </span>
                  <button 
                    onClick={() => handleDelete(campaign.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-2">{campaign.name}</h3>
              <p className="text-sm text-slate-500 mb-6 line-clamp-2">{campaign.message}</p>

              <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enviadas</p>
                  <p className="text-lg font-black text-slate-900">{campaign.sentCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Entregues</p>
                  <p className="text-lg font-black text-slate-900">{campaign.deliveredCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lidas</p>
                  <p className="text-lg font-black text-emerald-500">{campaign.readCount}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Calendar size={14} />
                {campaign.scheduledAt 
                  ? new Date(campaign.scheduledAt).toLocaleDateString() 
                  : 'Envio Imediato'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900">Nova Campanha</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Campanha</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                  placeholder="Ex: Promoção de Natal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Plataforma</label>
                  <select 
                    value={formData.platform}
                    onChange={e => setFormData({...formData, platform: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="INSTAGRAM">Instagram</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Agendamento (Opcional)</label>
                  <input 
                    type="datetime-local" 
                    value={formData.scheduledAt}
                    onChange={e => setFormData({...formData, scheduledAt: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mensagem</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                  placeholder="Digite o conteúdo da mensagem..."
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  {isLoading ? 'Criando...' : 'Criar Campanha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Broadcast;
