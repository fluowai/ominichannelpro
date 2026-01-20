import React, { useEffect, useState } from 'react';
import { 
  Smartphone, 
  Instagram, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Trash2,
  RefreshCw,
  QrCode,
  X,
  Globe,
  Loader2,
  Settings
} from 'lucide-react';
import { useIntegrationsStore } from '../store/integrationsStore';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../store/settingsStore';

const Integrations = () => {
  const { integrations, isLoading, fetchIntegrations, createIntegration, deleteIntegration, checkIntegrationStatus, connectIntegration, updateIntegration } = useIntegrationsStore();
  const { settings, fetchSettings } = useSettingsStore();

  const [showModal, setShowModal] = useState(false);
  const [useGlobalConfig, setUseGlobalConfig] = useState(true);
  
  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [settingsForm, setSettingsForm] = useState({ ignoreGroups: false });

  // QR Code State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // ... (existing code)

  const openSettings = (integration: any) => {
      setSelectedIntegration(integration);
      // Ensure config object exists
      const config = integration.config || {};
      setSettingsForm({
          ignoreGroups: config.ignoreGroups === true
      });
      setShowSettingsModal(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedIntegration) return;

      try {
          await updateIntegration(selectedIntegration.id, {
              config: {
                  ignoreGroups: settingsForm.ignoreGroups
              }
          });
          toast.success('Configurações salvas!');
          setShowSettingsModal(false);
      } catch (error) {
          toast.error('Erro ao salvar configurações');
      }
  };



  const [formData, setFormData] = useState({
    name: '',
    type: 'EVOLUTION_API',
    instanceUrl: '',
    apiKey: '',
    userToken: '' // For WUZAPI
  });

  useEffect(() => {
    fetchIntegrations();
    fetchSettings();
  }, [fetchIntegrations, fetchSettings]);

  // Update form when modal opens or settings load
  useEffect(() => {
     if (showModal && settings.evolution_api && useGlobalConfig) {
         setFormData(prev => ({
             ...prev,
             instanceUrl: settings.evolution_api!.baseUrl,
             apiKey: settings.evolution_api!.globalApiKey
         }));
     }
  }, [showModal, settings, useGlobalConfig]);

  // Auto-check for Evolution API
  useEffect(() => {
    if (integrations.length > 0) {
      const interval = setInterval(() => {
          integrations.forEach(integration => {
            if ((integration.type === 'EVOLUTION_API' || integration.type.includes('WHATSAPP')) && integration.status !== 'CONNECTED') {
               checkIntegrationStatus(integration.id);
            }
          });
      }, 10000); // Check every 10s
      return () => clearInterval(interval);
    }
  }, [integrations, checkIntegrationStatus]);

  const handleRefreshStatus = async (id: string) => {
      const status = await checkIntegrationStatus(id);
      if(status) toast.success(`Status atualizado: ${status}`);
      else toast.error('Falha ao verificar status');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data - omit credentials if using global config
      const submitData: any = { name: formData.name, type: formData.type };
      
      // Only include credentials if NOT using global config or no global config exists
      const hasEvolutionGlobal = !!settings.evolution_api;
      const hasWuzapiGlobal = !!settings.wuzapi;
      
      if (formData.type === 'EVOLUTION_API') {
        // If no global config, send credentials
        if (!hasEvolutionGlobal) {
          submitData.instanceUrl = formData.instanceUrl;
          submitData.apiKey = formData.apiKey;
        }
        // If has global, backend will use it automatically
      } else if (formData.type === 'WUZAPI') {
        // If no global WUZAPI config, send credentials
        if (!hasWuzapiGlobal) {
          submitData.instanceUrl = formData.instanceUrl;
          submitData.userToken = formData.userToken;
        }
        // If has global, backend will use it automatically
      }

      // 1. Create Integration
      const newIntegration = await createIntegration(submitData);
      toast.success('Integração criada!');
      setShowModal(false);
      setFormData({ name: '', type: 'EVOLUTION_API', instanceUrl: '', apiKey: '', userToken: '' });

      // 2. Auto Connect if it's WhatsApp (Evolution or WUZAPI)
      if (newIntegration.type === 'EVOLUTION_API' || newIntegration.type === 'WUZAPI' || newIntegration.type.includes('WHATSAPP')) {
          setConnectingId(newIntegration.id);
          try {
              const data = await connectIntegration(newIntegration.id);
              if (data.qrcode || data.qr) {
                  setQrCodeData(data.qrcode || data.qr);
                  setShowQRModal(true);
              } else if (data.status === 'CONNECTED') {
                   toast.success('Conectado com sucesso!');
              }
          } catch (connError: any) {
              const msg = connError.response?.data?.error || 'Erro ao conectar automaticamente. Tente manualmente.';
              toast.error(msg);
          } finally {
              setConnectingId(null);
          }
      }

    } catch (error: any) {
      console.error('Create error:', error);
      const msg = error.response?.data?.error || 'Erro ao criar integração';
      toast.error(msg);
    }
  };

  const handleManualConnect = async (id: string) => {
      setConnectingId(id);
      try {
          const data = await connectIntegration(id);
          if (data.qrcode) {
              setQrCodeData(data.qrcode);
              setShowQRModal(true);
          } else if (data.status === 'CONNECTED') {
               toast.success('Conectado com sucesso!');
               fetchIntegrations();
          }
      } catch (error) {
          toast.error('Erro ao gerar conexão');
      } finally {
          setConnectingId(null);
      }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Remover integração?')) {
      try {
        await deleteIntegration(id);
        toast.success('Integração removida');
      } catch (error) {
        toast.error('Erro ao remover');
      }
    }
  };

  const testWebhook = async (integrationId: string) => {
    try {
      const { api } = await import('../services/api');
      const response = await api.post(`/integrations/${integrationId}/test-webhook`);
      toast.success('Webhook testado com sucesso!');
      console.log('Webhook test response:', response.data);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erro ao testar webhook';
      toast.error(msg);
      console.error('Webhook test error:', error.response?.data);
    }
  };

  const hasGlobalConfig = !!settings.evolution_api;

  return (
    <div className="p-10 font-['Poppins'] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Integrações</h1>
          <p className="text-slate-500 font-medium">Conecte seus canais de comunicação.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 active:scale-95"
        >
          <Plus size={24} />
          Nova Conexão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {isLoading && integrations.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-400">Carregando integrações...</div>
        ) : integrations.length === 0 ? (
           <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[2rem]">
             <Smartphone size={64} className="text-slate-300 mb-6" />
             <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhuma integração ativa</h3>
             <p className="text-slate-500">Conecte o WhatsApp ou Instagram para começar.</p>
           </div>
        ) : (
          integrations.map((integration) => (
            <div key={integration.id} className="bg-white p-8 rounded-[2rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
                  integration.type.includes('INSTAGRAM') ? 'bg-pink-50 text-pink-600' : 'bg-green-50 text-green-600'
                }`}>
                  {integration.type.includes('INSTAGRAM') ? <Instagram size={32} /> : <Smartphone size={32} />}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                  integration.status === 'CONNECTED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {integration.status === 'CONNECTED' ? (
                    <><CheckCircle size={12} /> Conectado</>
                  ) : (
                    <><XCircle size={12} /> Desconectado</>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-2">{integration.name}</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">
                {integration.type === 'EVOLUTION_API' ? 'WhatsApp (Evolution API)' : 
                 integration.type === 'WUZAPI' ? 'WhatsApp (WUZAPI)' : 'Instagram Direct'}
              </p>



              <div className="flex gap-2 mt-auto">
                 <button 
                    onClick={() => openSettings(integration)}
                    className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                    title="Configurações"
                 >
                    <Settings size={20} />
                 </button>
                 <button 
                    onClick={() => handleRefreshStatus(integration.id)}
                    className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    title="Verificar Status"
                 >
                    <RefreshCw size={20} />
                 </button>
                 {integration.status !== 'CONNECTED' && (integration.type === 'EVOLUTION_API' || integration.type === 'WUZAPI' || integration.type.includes('WHATSAPP')) && (
                    <button 
                        onClick={() => handleManualConnect(integration.id)}
                        disabled={connectingId === integration.id}
                        className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {connectingId === integration.id ? (
                          <Loader2 size={16} className="animate-spin" />
                      ) : (
                          <QrCode size={16} />
                      )}
                      {connectingId === integration.id ? 'Conectando...' : 'Conectar'}
                    </button>
                 )}
                <button 
                  onClick={() => handleDelete(integration.id)}
                  className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900">Nova Integração</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Conexão</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none placeholder:text-slate-300"
                  placeholder="Ex: WhatsApp Comercial"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Provedor WhatsApp</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none text-slate-600 font-medium"
                >
                  <option value="EVOLUTION_API">Evolution API</option>

                  <option value="INSTAGRAM_OFFICIAL">Instagram (Oficial)</option>
                </select>
              </div>

              {/* WUZAPI Fields */}
              {formData.type === 'WUZAPI' && (
                <>
                  {!!settings.wuzapi ? (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Globe size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-800">✅ Usando Configuração Global</p>
                        <p className="text-xs text-blue-600">O sistema gerenciará a URL e o Token automaticamente.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-4">
                        <p className="text-xs text-amber-700">⚠️ Configure WUZAPI globalmente em <b>Configurações</b> para simplificar.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">API URL</label>
                        <input 
                          type="text"
                          value={formData.instanceUrl}
                          onChange={e => setFormData({...formData, instanceUrl: e.target.value})} 
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                          placeholder="https://wooapi.boow.com.br"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">User Token</label>
                        <input 
                          type="text"
                          value={formData.userToken}
                          onChange={e => setFormData({...formData, userToken: e.target.value})} 
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                          placeholder="Token (ou deixe em branco para auto-gerar)"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Evolution API Fields */}
              {formData.type === 'EVOLUTION_API' && (
                <>
                  {!!settings.evolution_api ? (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg text-green-600">
                        <Globe size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-800">✅ Usando Configuração Global</p>
                        <p className="text-xs text-green-600">Credenciais Evolution API do sistema.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-4">
                        <p className="text-xs text-amber-700">⚠️ Configure Evolution API globalmente em <b>Configurações</b> para simplificar.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">URL da Instância</label>
                        <input 
                          type="text"
                          value={formData.instanceUrl}
                          onChange={e => setFormData({...formData, instanceUrl: e.target.value})} 
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                          placeholder="https://api.evolution.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">API Key</label>
                        <input 
                          type="text"
                          value={formData.apiKey}
                          onChange={e => setFormData({...formData, apiKey: e.target.value})} 
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
                          placeholder="Sua API Key"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

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
                  {isLoading ? 'Criando...' : 'Criar e Conectar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">Configurações</h2>
                <p className="text-sm text-slate-500">{selectedIntegration.name}</p>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="p-8 space-y-6">
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer" onClick={() => setSettingsForm({ ...settingsForm, ignoreGroups: !settingsForm.ignoreGroups })}>
                  <div>
                      <h3 className="font-bold text-slate-900">Ocultar Grupos</h3>
                      <p className="text-xs text-slate-500 max-w-[200px]">Se ativado, mensagens de grupos serão ignoradas e não aparecerão no chat.</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settingsForm.ignoreGroups ? 'bg-orange-600' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${settingsForm.ignoreGroups ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrCodeData && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Escaneie o QR Code</h3>
                  <p className="text-slate-500 mb-6">Abra o WhatsApp &gt; Aparelhos Conectados &gt; Conectar Aparelho</p>
                  
                  <div className="bg-white p-4 rounded-xl border-4 border-slate-100 mb-6 inline-block">
                      <img src={qrCodeData} alt="QR Code" className="w-64 h-64 object-contain" />
                  </div>

                  <button 
                      onClick={() => {
                          setShowQRModal(false);
                          setQrCodeData(null);
                          fetchIntegrations();
                      }}
                      className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all"
                  >
                      Concluído / Fechar
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};

export default Integrations;
