
import React, { useState, useEffect } from 'react';
import { 
  Instagram as InstagramIcon, 
  Plus, 
  Calendar, 
  MessageSquare, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Trash2,
  Send,
  Image as ImageIcon,
  Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

interface InstagramAccount {
  id: string;
  username: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export default function Instagram() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Post Form States
  const [activeTab, setActiveTab] = useState<'accounts' | 'scheduler' | 'automations'>('accounts');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [postType, setPostType] = useState<'POST' | 'REEL' | 'STORY'>('POST');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts]);

  const handleCreatePost = async (immediate: boolean) => {
    if (!selectedAccount) return toast.error('Selecione uma conta');
    if (!mediaUrl) return toast.error('Insira a URL da mídia');
    if (!immediate && !scheduleDate) return toast.error('Selecione uma data para agendamento');

    setIsPosting(true);
    try {
      if (immediate) {
        // Postagem Imediata via Direct API Action (ou rota dedicada)
        await api.post('/instagram/actions', 
          { 
            accountId: selectedAccount, 
            action: 'post',
            type: postType,
            caption,
            mediaUrls: [mediaUrl]
          }
        );
        toast.success('Postado com sucesso!');
      } else {
        // Agendamento via tabela
        await api.post('/instagram/posts', 
          { 
            accountId: selectedAccount, 
            type: postType,
            caption,
            mediaUrls: [mediaUrl],
            scheduledAt: scheduleDate
          }
        );
        toast.success('Post agendado para ' + new Date(scheduleDate).toLocaleString());
      }
      
      // Limpar campos
      setCaption('');
      setMediaUrl('');
      setScheduleDate('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao processar postagem');
    } finally {
      setIsPosting(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/instagram/accounts');
      setAccounts(response.data.accounts);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast.error('Erro ao listar contas do Instagram');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    try {
      await api.post('/instagram/accounts', 
        { username, password }
      );
      toast.success('Conta conectada com sucesso!');
      setShowAddModal(false);
      setUsername('');
      setPassword('');
      fetchAccounts();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao conectar conta';
      console.error('Erro de login Instagram:', errorMsg);
      toast.error(errorMsg, { duration: 6000 });
      
      if (errorMsg.toLowerCase().includes('checkpoint') || errorMsg.toLowerCase().includes('challenge')) {
        toast('Sua conta requer verificação manual. Abra o app do Instagram e confirme que foi você.', { icon: '🔐', duration: 8000 });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-50 soft-shadow">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <InstagramIcon className="text-pink-500" size={32} />
            Instagram Hub
          </h2>
          <p className="text-slate-500 font-medium mt-1">Gerencie agendamentos, automações e DMs do Instagram</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl">
          <button 
            onClick={() => setActiveTab('accounts')}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'accounts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Contas
          </button>
          <button 
            onClick={() => setActiveTab('scheduler')}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'scheduler' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Agendador
          </button>
          <button 
            onClick={() => setActiveTab('automations')}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'automations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Automações
          </button>
        </div>
      </div>

      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Suas Conexões</h3>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all soft-shadow"
            >
              <Plus size={20} />
              Nova Conta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center">Carregando contas...</div>
            ) : accounts.length === 0 ? (
              <div className="col-span-full py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <InstagramIcon size={32} />
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-lg">Nenhuma conta conectada</p>
                  <p className="text-slate-400 text-sm">Conecte sua primeira conta do Instagram para começar</p>
                </div>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 soft-shadow group hover:border-orange-200 transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                      <span className="text-xl font-bold">{account.username.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${account.status === 'CONNECTED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {account.status}
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-8">
                    <h4 className="text-xl font-black text-slate-900">@{account.username}</h4>
                    <p className="text-xs text-slate-400 font-medium">Conectado em {new Date(account.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">
                      Configurar
                    </button>
                    <button className="px-4 py-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'scheduler' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Post Form */}
          <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-50 soft-shadow space-y-6 h-fit">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Plus className="text-orange-500" size={24} />
              Novo Conteúdo
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conta</label>
                <select 
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>@{acc.username}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</label>
                <div className="flex gap-2">
                  {(['POST', 'REEL', 'STORY'] as const).map((type) => (
                    <button 
                      key={type}
                      onClick={() => setPostType(type)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${postType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-600'}`}
                    >
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legenda</label>
                <textarea 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium outline-none resize-none h-24"
                  placeholder="Escreva sua legenda aqui..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mídia (URL)</label>
                <div className="relative group">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm font-medium outline-none"
                    placeholder="Cole o link da imagem/vídeo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data de Agendamento</label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="datetime-local" 
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm font-medium outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <button 
                  onClick={() => handleCreatePost(true)}
                  disabled={isPosting}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100 disabled:opacity-50"
                >
                  <Send size={18} />
                  {isPosting ? 'Enviando...' : 'Postar Agora'}
                </button>
                
                <button 
                  onClick={() => handleCreatePost(false)}
                  disabled={isPosting}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-100 disabled:opacity-50"
                >
                  <Calendar size={18} />
                  Agendar para depois
                </button>
              </div>
            </div>
          </div>

          {/* List of Scheduled Posts */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight px-4">Fila de Postagens</h3>
            
            <div className="bg-white rounded-[2.5rem] border border-slate-50 soft-shadow overflow-hidden">
              <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Calendar size={32} />
                </div>
                <div>
                  <p className="text-slate-900 font-bold">Nenhum post agendado</p>
                  <p className="text-slate-400 text-sm">Crie sua primeira postagem ao lado para vê-la aqui.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'automations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-50 soft-shadow space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                <UserPlus size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Boas-vindas</h3>
            </div>
            <p className="text-slate-500 text-sm border-b border-slate-50 pb-6">Envie uma DM automática para novos seguidores.</p>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Status da Automação</span>
                <div className="w-12 h-6 bg-orange-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mensagem Padrão</label>
                <textarea 
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-orange-100 transition-all outline-none resize-none h-32"
                  placeholder="Ex: Olá {username}, seja bem-vindo ao nosso perfil! Como podemos te ajudar?"
                />
              </div>
              <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all">
                Salvar Regra
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-50 soft-shadow space-y-6 opacity-60">
             <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Auto-Resposta DM</h3>
            </div>
            <p className="text-slate-500 text-sm">Responda automaticamente a palavras-chave (Em breve).</p>
          </div>
        </div>
      )}

      {/* Modal Nova Conta */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <InstagramIcon size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Conectar Instagram</h3>
              <p className="text-slate-400 text-sm font-medium px-4">Utilizamos a API Privada para permitir o agendamento completo.</p>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Usuário</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                  placeholder="@seuperfil"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Senha</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  type="submit"
                  disabled={isConnecting}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-base hover:bg-orange-600 transition-all shadow-xl shadow-slate-100 disabled:opacity-50"
                >
                  {isConnecting ? 'Validando Conta...' : 'Conectar Agora'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full text-slate-400 py-2 font-bold text-sm hover:text-slate-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
