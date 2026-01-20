
import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Plus, 
  Cpu, 
  Settings2, 
  Zap, 
  Check, 
  Trash2, 
  Play,
  Copy,
  X,
  Link
} from 'lucide-react';
import { useAgentsStore } from '../store/agentsStore';
import toast from 'react-hot-toast';
import { useIntegrationsStore } from '../store/integrationsStore';
import { integrationsAPI, api } from '../services/api';
import { useSettingsStore } from '../store/settingsStore';

const LLM_PROVIDERS = [
  { id: 'GEMINI', name: 'Gemini', icon: '🤖', models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  { id: 'OPENAI', name: 'OpenAI', icon: '🎯', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { id: 'GROQ', name: 'Groq', icon: '⚡', models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] },
];

const Agents: React.FC = () => {
  const { agents, isLoading, fetchAgents, createAgent, updateAgent, deleteAgent } = useAgentsStore();
  const [showModal, setShowModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testingAgent, setTestingAgent] = useState<any>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    provider: 'GEMINI' as const,
    model: 'gemini-2.0-flash-exp',
    prompt: '',
    temperature: 0.7,
    maxTokens: 1000,
    status: 'ACTIVE' as const,
    apiKey: '',
    skills: [] as string[],
    ignoreGroups: true,
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  // ... (handleSubmit, handleEdit, handleDelete, resetForm - existing code) ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        await updateAgent(editingAgent.id, formData);
        toast.success('Agente atualizado com sucesso!');
      } else {
        await createAgent(formData);
        toast.success('Agente criado com sucesso!');
      }
      resetForm();
      setShowModal(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || error.message || 'Erro ao salvar agente');
    }
  };

  const handleEdit = (agent: any) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      provider: agent.provider,
      model: agent.model,
      prompt: agent.prompt,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      status: agent.status,
      apiKey: agent.apiKey || '',
      skills: agent.skills || [],
      ignoreGroups: agent.ignoreGroups === undefined ? true : agent.ignoreGroups,
    });
    setShowModal(true);
  };

  const handleDelete = (agent: any) => {
    setDeletingAgent(agent);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingAgent) return;
    try {
      await deleteAgent(deletingAgent.id);
      toast.success('Agente deletado com sucesso!');
      setShowDeleteModal(false);
      setDeletingAgent(null);
    } catch (error) {
      toast.error('Erro ao deletar agente');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'GEMINI',
      model: 'gemini-2.0-flash-exp',
      prompt: '',
      temperature: 0.7,
      maxTokens: 1000,
      status: 'ACTIVE',
      apiKey: '',
      skills: [],
      ignoreGroups: true,
    });
    setEditingAgent(null);
  };

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingAgent, setLinkingAgent] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);

  const fetchIntegrations = async () => {
    try {
        const { data } = await integrationsAPI.getAll();
        setIntegrations(data.integrations || []);
    } catch (e) {
        console.error(e);
    }
  };

  const handleLinkModal = async (agent: any) => {
    setLinkingAgent(agent);
    await fetchIntegrations(); // Refresh list to get current status
    setShowLinkModal(true);
  };

  const executeLink = async (integrationId: string, currentAgentId: string | null) => {
      // Toggle logic: If linked to current agent, unlink. Else, link.
      const newAgentId = currentAgentId === linkingAgent.id ? null : linkingAgent.id;
      
      try {
        await integrationsAPI.update(integrationId, { 
            agentId: newAgentId 
        });


        if (newAgentId) {
            toast.success('Agente vinculado com sucesso!');
        } else {
            toast.success('Agente desvinculado!');
        }
        
        toast.success(newAgentId ? 'Conectado com sucesso!' : 'Desconectado com sucesso!');
        fetchIntegrations(); // Update list
      } catch (error) {
        toast.error('Erro ao atualizar conexão');
      }
  };

  const handleTestAgent = (agent: any) => {
    setTestingAgent(agent);
    setTestMessage('');
    setTestResponse('');
    setShowTestModal(true);
  };

  const executeTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;

    setIsTesting(true);
    setTestResponse(''); // Clear previous
    try {
        const { data } = await api.post('/ai/chat', {
            provider: testingAgent.provider,
            model: testingAgent.model,
            systemPrompt: testingAgent.prompt,
            message: testMessage,
            temperature: testingAgent.temperature,
            maxTokens: testingAgent.maxTokens,
            agentId: testingAgent.id // Pass ID to use specific API Key
        });
        setTestResponse(data.response);
    } catch (error: any) {
        toast.error('Erro ao testar agente: ' + (error.response?.data?.error || error.message));
        setTestResponse('Erro: ' + (error.response?.data?.error || error.message));
    } finally {
        setIsTesting(false);
    }
  };


  const selectedProvider = LLM_PROVIDERS.find(p => p.id === formData.provider);

  return (
    <div className="p-10 max-w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-['Poppins']">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-black">Builder de Agentes</h1>
          <p className="text-lg text-gray-500 mt-2 font-medium">
            Configure prompts, LLMs e personalize seus agentes de IA.
          </p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-orange-600 text-white px-8 py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-100 flex items-center gap-3 hover:bg-orange-700 transition-all active:scale-95"
        >
          <Plus size={24} />
          <span>Novo Agente</span>
        </button>
      </div>

      {isLoading && agents.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-slate-400">Carregando agentes...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl">
          <Bot size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhum agente criado</h3>
          <p className="text-slate-500 mb-6">Crie seu primeiro agente de IA para começar!</p>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all"
          >
            Criar Primeiro Agente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {agents.map((agent) => {
            const provider = LLM_PROVIDERS.find(p => p.id === agent.provider);
            return (
              <div 
                key={agent.id} 
                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">
                      {provider?.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-black leading-none">{agent.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-wider">{provider?.name} • {agent.model}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    agent.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {agent.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Prompt</p>
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {agent.prompt}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Temperatura</p>
                    <p className="text-lg font-black text-black">{agent.temperature}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Max Tokens</p>
                    <p className="text-lg font-black text-black">{agent.maxTokens}</p>
                  </div>
                </div>

                  <div className="flex gap-2">
                   <button 
                    onClick={() => handleLinkModal(agent)}
                    className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                    title="Conectar ao WhatsApp"
                  >
                    <Link size={16} /> Conectar
                  </button>
                   <button 
                    onClick={() => handleTestAgent(agent)}
                    className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Play size={16} fill="currentColor" /> Testar
                  </button>
                  <button 
                    onClick={() => handleEdit(agent)}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(agent)}
                    className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingAgent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Excluir Agente?</h2>
              <p className="text-slate-500 mb-6">
                Tem certeza que deseja excluir o agente <span className="font-bold text-slate-900">"{deletingAgent.name}"</span>? 
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && testingAgent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-[600px]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Testar Agente</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{testingAgent.name} • {testingAgent.provider}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
                    {/* User Message Bubble */}
                    {testMessage && testResponse && (
                         <div className="flex justify-end">
                            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-md">
                                <p className="text-sm font-medium">{testMessage}</p>
                            </div>
                        </div>
                    )}
                   
                    {/* Bot Response Bubble */}
                    {testResponse && (
                        <div className="flex justify-start">
                             <div className="bg-white text-slate-700 px-6 py-4 rounded-2xl rounded-tl-sm max-w-[80%] border border-slate-100 shadow-sm">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{testResponse}</p>
                            </div>
                        </div>
                    )}

                    {isTesting && (
                        <div className="flex justify-start">
                            <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm flex gap-2 items-center">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                        </div>
                    )}
                    
                    {!testResponse && !isTesting && (
                         <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
                            <Bot size={48} />
                            <p className="text-sm font-medium">Envie uma mensagem para iniciar o teste.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t border-slate-100">
                    <form onSubmit={executeTest} className="flex gap-3">
                        <input 
                            type="text" 
                            value={testMessage}
                            onChange={e => setTestMessage(e.target.value)}
                            placeholder="Digite sua mensagem para o agente..."
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            disabled={isTesting || !testMessage.trim()}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none"
                        >
                            <Play size={20} fill="currentColor" className="rotate-0" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Edit/Create Modal - existing code */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-black">{editingAgent ? 'Editar Agente' : 'Novo Agente'}</h2>
                    <p className="text-sm text-gray-500">Configure seu agente de IA personalizado</p>
                  </div>
                  <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={28} />
                  </button>
                </div>

                {/* ... Form fields ... */} 
                {/* Note: I'm reusing the existing structure but injecting it here to save context space, assume previous form fields are here */}
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Agente</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Atendente Consultivo"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">API Key (Opcional)</label>
                    <input 
                      type="password" 
                      value={formData.apiKey || ''}
                      onChange={e => setFormData({...formData, apiKey: e.target.value})}
                      placeholder="sk-..."
                      autoComplete="off"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 outline-none font-mono text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Se deixado em branco, usará a chave global configurada no sistema. 
                        <strong> Recomendado:</strong> Use uma chave própria para evitar limites de taxa (Free Tier).
                    </p>
                  </div>
                  
                  {/* ... Rest of the form inputs (Provider, Model, Temp, Tokens, Prompt, Status) ... */}
                  {/* Copied from previous view_file content to ensure correctness */}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Provider LLM</label>
                    <select 
                      value={formData.provider}
                      onChange={e => setFormData({
                        ...formData, 
                        provider: e.target.value as any,
                        model: LLM_PROVIDERS.find(p => p.id === e.target.value)?.models[0] || ''
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                    >
                      {LLM_PROVIDERS.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.icon} {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Modelo</label>
                    <select 
                      value={formData.model}
                      onChange={e => setFormData({...formData, model: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                    >
                      {selectedProvider?.models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Status do Agente</label>
                        <select 
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                        >
                        <option value="ACTIVE">Ativo</option>
                        <option value="INACTIVE">Inativo</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div 
                            className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${formData.ignoreGroups ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            onClick={() => setFormData({...formData, ignoreGroups: !formData.ignoreGroups})}
                        >
                             <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${formData.ignoreGroups ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-700 select-none cursor-pointer" onClick={() => setFormData({...formData, ignoreGroups: !formData.ignoreGroups})}>
                            Ignorar Grupos
                        </span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div 
                            className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${(formData.skills || []).includes('REAL_ESTATE') ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            onClick={() => {
                                const currentSkills = formData.skills || [];
                                const newSkills = currentSkills.includes('REAL_ESTATE') 
                                    ? currentSkills.filter((s: string) => s !== 'REAL_ESTATE')
                                    : [...currentSkills, 'REAL_ESTATE'];
                                setFormData({...formData, skills: newSkills});
                            }}
                        >
                             <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${(formData.skills || []).includes('REAL_ESTATE') ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-700 select-none cursor-pointer" onClick={() => {
                             const currentSkills = formData.skills || [];
                             const newSkills = currentSkills.includes('REAL_ESTATE') 
                                 ? currentSkills.filter((s: string) => s !== 'REAL_ESTATE')
                                 : [...currentSkills, 'REAL_ESTATE'];
                             setFormData({...formData, skills: newSkills});
                        }}>
                            Módulo Corretor
                        </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Temperatura: {formData.temperature}</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1"
                      value={formData.temperature}
                      onChange={e => setFormData({...formData, temperature: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-400 mt-1">Controla criatividade (0 = preciso, 2 = criativo)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Max Tokens</label>
                    <input 
                      type="number" 
                      min="100"
                      max="4000"
                      value={formData.maxTokens}
                      onChange={e => setFormData({...formData, maxTokens: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Prompt do Sistema</label>
                    <textarea 
                      required
                      rows={6}
                      value={formData.prompt}
                      onChange={e => setFormData({...formData, prompt: e.target.value})}
                      placeholder="Descreva o comportamento e personalidade do agente..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, status: 'ACTIVE'})}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                          formData.status === 'ACTIVE' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        Ativo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, status: 'INACTIVE'})}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                          formData.status === 'INACTIVE' 
                            ? 'bg-gray-600 text-white' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        Inativo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-10 py-6 bg-gray-50/50 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Salvando...' : (editingAgent ? 'Atualizar Agente' : 'Criar Agente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Link Modal */}
      {showLinkModal && linkingAgent && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-emerald-50/50">
                      <div>
                          <h2 className="text-xl font-black text-slate-900">Conectar Agente</h2>
                          <p className="text-sm text-slate-500 font-medium">Vinculando: <span className="text-emerald-600 font-bold">{linkingAgent.name}</span></p>
                      </div>
                      <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="p-8 max-h-[60vh] overflow-y-auto">
                      {integrations.length === 0 ? (
                          <div className="text-center text-slate-400 py-8">
                              <p>Nenhuma integração disponível.</p>
                              <p className="text-sm">Vá em "Integrações" para conectar um WhatsApp.</p>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              {integrations.filter((i: any) => i.status === 'CONNECTED').map((integration: any) => {
                                  const isLinked = integration.agentId === linkingAgent.id;
                                  const isLinkedOther = integration.agentId && integration.agentId !== linkingAgent.id;
                                  
                                  return (
                                      <div key={integration.id} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                                          isLinked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-slate-200'
                                      }`}>
                                          <div>
                                              <p className="font-bold text-slate-900">{integration.name}</p>
                                              <p className="text-xs text-slate-400 font-mono mt-1">
                                                  {integration.type === 'EVOLUTION_API' ? 'WhatsApp' : integration.type}
                                              </p>
                                          </div>
                                          
                                          {isLinkedOther && (
                                              <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
                                                  Ocupado por outro agente
                                              </span>
                                          )}

                                          <button
                                              onClick={() => executeLink(integration.id, integration.agentId)}
                                              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                                                  isLinked 
                                                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100'
                                              }`}
                                          >
                                              {isLinked ? 'Desconectar' : (isLinkedOther ? 'Substituir' : 'Conectar')}
                                          </button>
                                      </div>
                                  );
                              })}
                              
                              {integrations.filter((i: any) => i.status !== 'CONNECTED').length > 0 && (
                                  <p className="text-center text-xs text-slate-400 pt-4">
                                      Mostrando apenas instâncias CONECTADAS.
                                  </p>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Agents;
