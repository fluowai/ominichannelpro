
import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Users, 
  Key, 
  Bell, 
  Globe,
  Plus,
  MoreVertical,
  X,
  Check,
  Search,
  Lock,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Agente' | 'Analista';
  status: 'Ativo' | 'Pendente';
  avatar: string;
}


// ... (other imports)

const UserSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'security'>('profile');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Agente' });
  const [team, setTeam] = useState<TeamMember[]>([
    { id: '1', name: 'João Dev', email: 'joao@fluow.ai', role: 'Admin', status: 'Ativo', avatar: 'https://picsum.photos/seed/joao/100' },
    { id: '2', name: 'Maria Agente', email: 'maria@fluow.ai', role: 'Agente', status: 'Ativo', avatar: 'https://picsum.photos/seed/maria/100' },
    { id: '3', name: 'Carlos Analista', email: 'carlos@fluow.ai', role: 'Analista', status: 'Pendente', avatar: 'https://picsum.photos/seed/carlos/100' },
  ]);

  // ... (existing state)

      <div className="flex border-b border-gray-200 gap-8 overflow-x-auto no-scrollbar">
        {/* ... existing tabs ... */}
        <button 
          onClick={() => setActiveTab('profile')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
            activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Meu Perfil
        </button>
        <button 
          onClick={() => setActiveTab('team')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
            activeTab === 'team' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Gestão de Equipe
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
            activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Segurança
        </button>

      </div>

      {/* ... existing tabs content ... */}



  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role as any,
      status: 'Pendente',
      avatar: `https://picsum.photos/seed/${inviteForm.name}/100`
    };
    setTeam([...team, newMember]);
    setShowInviteModal(false);
    setInviteForm({ name: '', email: '', role: 'Agente' });
  };

  const removeMember = (id: string) => {
    setTeam(team.filter(m => m.id !== id));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-500 mt-1">Gerencie seu perfil, equipe e acessos da plataforma Fluow AI.</p>
      </div>

      <div className="flex border-b border-gray-200 gap-8 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
            activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Meu Perfil
        </button>
        <button 
          onClick={() => setActiveTab('team')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
            activeTab === 'team' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Gestão de Equipe
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
            activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Segurança e API
        </button>

      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-300">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="relative inline-block mb-4">
                <img src="https://picsum.photos/seed/user/200" className="w-24 h-24 rounded-full border-4 border-gray-50 shadow-sm object-cover" alt="" />
                <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700">
                  <Plus size={14} />
                </button>
              </div>
              <h3 className="font-bold text-lg text-gray-900">João Dev</h3>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 py-1 rounded-full mt-2">Administrador Master</p>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Nome Completo</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" defaultValue="João Dev" className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Email Corporativo</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" defaultValue="joao@fluow.ai" className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Sobre você</label>
              <textarea rows={4} className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm resize-none"></textarea>
            </div>
            <div className="pt-4 flex justify-end">
              <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Buscar membros..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm" />
            </div>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              <Plus size={16} /> Convidar Membro
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Membro</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Papel / Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {team.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={member.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{member.name}</h4>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        defaultValue={member.role}
                        className="bg-gray-50 border border-gray-100 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option>Admin</option>
                        <option>Agente</option>
                        <option>Analista</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        member.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Settings size={16} />
                        </button>
                        <button 
                          onClick={() => removeMember(member.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Alterar Senha de Acesso</h3>
                <p className="text-sm text-gray-500">Recomendamos trocar sua senha a cada 90 dias.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Senha Atual</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Nova Senha</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none" />
              </div>
            </div>
            <div className="flex justify-end">
              <button className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-black transition-all">
                Atualizar Senha
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Key size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Token de API Corporativo</h3>
                  <p className="text-sm text-gray-500">Use este token para autenticar requisições de sistemas externos.</p>
                </div>
              </div>
              <button className="text-xs font-bold text-blue-600 uppercase hover:underline">Gerar Novo Token</button>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-3 overflow-hidden">
                <code className="text-xs bg-white px-3 py-1.5 rounded border border-gray-100 text-gray-600 truncate max-w-xs md:max-w-md font-mono">
                  fl_live_582910382910382910382910382910
                </code>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-400 hover:text-blue-600"><Eye size={18} /></button>
                <button className="p-2 text-gray-400 hover:text-blue-600 border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3">Copiar</button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Modal Convidar Membro */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <form onSubmit={handleInvite}>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Convidar Membro</h2>
                    <p className="text-xs text-gray-500">O convite será enviado por e-mail.</p>
                  </div>
                  <button type="button" onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Nome do Membro</label>
                    <input 
                      required
                      type="text" 
                      value={inviteForm.name}
                      onChange={e => setInviteForm({...inviteForm, name: e.target.value})}
                      placeholder="Ex: Ana Silva" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Email</label>
                    <input 
                      required
                      type="email" 
                      value={inviteForm.email}
                      onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                      placeholder="ana@fluow.ai" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Papel / Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Admin', 'Agente', 'Analista'].map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setInviteForm({...inviteForm, role: role as any})}
                          className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                            inviteForm.role === role ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-blue-200'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                   <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Permissões do Papel</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Check size={14} className="text-green-500" /> 
                          {inviteForm.role === 'Admin' ? 'Acesso total ao sistema' : inviteForm.role === 'Agente' ? 'Gerir conversas e contatos' : 'Visualizar relatórios e dashboards'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Check size={14} className="text-green-500" />
                          {inviteForm.role === 'Admin' ? 'Configurar APIs e faturamento' : inviteForm.role === 'Agente' ? 'Usar disparador de mensagens' : 'Acompanhar metas da equipe'}
                        </div>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="p-8 bg-gray-50/50 flex gap-4">
                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                  <Plus size={18} />
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;


