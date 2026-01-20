import React, { useState, useEffect } from 'react';
import { Globe, Key, Shield, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const AdminSettings = () => {
    const { settings, fetchSettings } = useSettingsStore();
    
    // Tabs
    const [activeTab, setActiveTab] = useState<'evolution' | 'llm'>('evolution');

    // Data States
    const [evoInstances, setEvoInstances] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        fetchSettings();
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch Evolution Instances
            try {
                const evoRes = await api.get('/settings/evolution/instances');
                setEvoInstances(evoRes.data || []);
            } catch (e) { console.error('Evo fetch error', e); }



        } catch (error) {
            console.error('Dashboard fetch error', error);
            toast.error('Erro ao carregar dados do dashboard');
        } finally {
            setLoading(false);
        }
    };

    // Helper to mask keys
    const maskKey = (key?: string) => key ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : 'Não configurado';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Configurações Globais</h1>
                <p className="text-slate-500 font-medium">Gerencie as conexões mestras e visualize o status do sistema.</p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Shield size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900 text-lg">Painel Super Admin</h3>
                    <p className="text-sm text-blue-700">
                        Visualização centralizada de todas as instâncias conectadas. 
                        As configurações ("URL", "API Key") são carregadas do arquivo <code className="bg-blue-100 px-1 rounded text-xs font-mono">.env</code> para segurança.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('evolution')}
                    className={`pb-4 px-4 font-bold transition-all ${activeTab === 'evolution' ? 'text-orange-600 border-b-4 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <Globe size={20} />
                        Evolution API
                    </div>
                </button>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
                
                {/* Evolution API Content */}
                {activeTab === 'evolution' && (
                    <div className="space-y-8">
                        {/* Config Check */}
                         <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                                    <Server size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">Evolution API (Mestra)</h3>
                                    <p className="text-sm text-slate-500">
                                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs mr-2">URL: {settings.evolution_api?.baseUrl || process.env.VITE_EVOLUTION_API_URL || 'Carregando...'}</span>
                                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">KEY: {maskKey(settings.evolution_api?.globalApiKey)}</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={fetchDashboardData}
                                disabled={loading}
                                className="flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                Atualizar
                            </button>
                        </div>
                        
                        {/* Instances List */}
                        <div>
                             <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">Instâncias Ativas ({evoInstances.length})</h4>
                            
                             {loading ? (
                                <div className="p-12 text-center text-slate-400">Carregando instâncias...</div>
                            ) : evoInstances.length === 0 ? (
                                <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-slate-500 font-medium">Nenhuma instância encontrada na Evolution API.</p>
                                    <p className="text-xs text-slate-400 mt-1">Verifique se o serviço está rodando e se a Key está correta no .env</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {evoInstances.map((inst: any, index: number) => {
                                        // Extract data with robust fallbacks
                                        const instanceData = inst.instance || inst;
                                        const name = instanceData.instanceName || instanceData.name || `Instance ${index + 1}`;
                                        const profileName = instanceData.profileName;
                                        const owner = instanceData.owner || instanceData.ownerJid || 'N/A';
                                        const status = instanceData.state || instanceData.connectionStatus || instanceData.status || 'unknown';
                                        const avatar = instanceData.profilePictureUrl || instanceData.profilePicUrl;
                                        
                                        return (
                                        <div key={name || `evo-${index}`} className="flex flex-col p-5 bg-slate-50 border border-slate-200 rounded-xl group hover:border-orange-200 hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    {avatar ? (
                                                        <img src={avatar} alt={name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                                                            {name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h5 className="font-bold text-slate-900 leading-tight">{profileName || name}</h5>
                                                        {profileName && <p className="text-xs text-slate-400">{name}</p>}
                                                    </div>
                                                </div>
                                                <span className={`w-2.5 h-2.5 rounded-full ${['open', 'connected'].includes(status) ? 'bg-green-500 shadow-lg shadow-green-200' : status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`} title={status} />
                                            </div>
                                            
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>Status</span>
                                                    <span className={`font-mono px-1.5 py-0.5 rounded border uppercase text-[10px] ${['open', 'connected'].includes(status) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 border-slate-200'}`}>
                                                        {status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>Número</span>
                                                    <span className="font-mono">{owner.split('@')[0]}</span>
                                                </div>
                                                {/* Raw Data Toggle (Hidden by default, can be added if needed or shown on hover) */}
                                                <details className="group/details">
                                                    <summary className="cursor-pointer text-[10px] text-slate-300 hover:text-orange-500 transition-colors list-none flex items-center gap-1 mt-2">
                                                        <span>Ver dados brutos</span>
                                                    </summary>
                                                    <pre className="mt-2 text-[10px] bg-slate-900 text-green-400 p-2 rounded overflow-x-auto max-h-32 scrollbar-thin scrollbar-thumb-slate-700 font-mono">
                                                        {JSON.stringify(inst, null, 2)}
                                                    </pre>
                                                </details>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <button className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded" title="Ação destrutiva">
                                                    Deletar
                                                </button>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminSettings;
