import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Download, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  Loader2,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { getAccessToken, getCurrentUser } from '../utils/auth';

const API_URL = '/'; // Use relative path since api already has baseURL

interface Integration {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface WhatsAppGroup {
  id: string;
  name: string;
  participantCount: number;
  selected: boolean;
}

interface ContactList {
  id: string;
  name: string;
  description?: string;
  _count?: {
    contacts: number;
  };
}

interface Contact {
  id: string;
  name: string;
  phone?: string;
  platform: string;
  tags: string[];
}

export default function GroupImport() {
  const [activeTab, setActiveTab] = useState<'import' | 'lists'>('import');
  const [step, setStep] = useState(1);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [selectedList, setSelectedList] = useState<string>('');
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContacts, setPreviewContacts] = useState<any[]>([]);
  const [currentImportGroup, setCurrentImportGroup] = useState<string>('');
  
  // List view states
  const [viewingList, setViewingList] = useState<ContactList | null>(null);
  const [listContacts, setListContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    loadIntegrations();
    loadContactLists();
  }, []);

  // Load lists with count when switching to lists tab
  useEffect(() => {
    if (activeTab === 'lists') {
      loadListsWithCount();
    }
  }, [activeTab]);

  const loadIntegrations = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error('Você precisa fazer login novamente');
        return;
      }
      
      const response = await api.get(`${API_URL}integrations`);
      
      const whatsappIntegrations = response.data.integrations.filter(
        (i: Integration) => i.type === 'EVOLUTION_API' && i.status === 'CONNECTED'
      );
      setIntegrations(whatsappIntegrations);
    } catch (error) {
      toast.error('Erro ao carregar integrações');
      console.error(error);
    }
  };

  const loadContactLists = async () => {
    try {
      const token = getAccessToken();
      const user = getCurrentUser();
      
      if (!token || !user) {
        return;
      }
      
      const response = await api.get(`${API_URL}contact-lists`, {
        params: { organizationId: user.organizationId },
      });
      setContactLists(response.data);
    } catch (error) {
      console.error('Erro ao carregar listas:', error);
    }
  };

  const loadGroups = async (integrationId: string) => {
    try {
      setLoading(true);
      const token = getAccessToken();
      
      if (!token) {
        toast.error('Você precisa fazer login novamente');
        setLoading(false);
        return;
      }
      
      console.log('Buscando grupos para integração:', integrationId);
      
      const response = await api.get(`${API_URL}integrations/${integrationId}/groups`);
      
      console.log('Resposta da API:', response.data);
      
      // Check if response has groups
      if (!response.data || (!response.data.groups && !Array.isArray(response.data))) {
        console.error('Formato de resposta inesperado:', response.data);
        toast.error('Nenhum grupo encontrado nesta instância');
        setLoading(false);
        return;
      }
      
      // Transform API response to our format
      const groupsData = response.data.groups || response.data;
      const transformedGroups: WhatsAppGroup[] = groupsData.map((group: any) => ({
        id: group.id,
        name: group.subject || group.name || 'Grupo sem nome',
        participantCount: group.participants?.length || group.size || 0,
        selected: false,
      }));
      
      console.log('Grupos transformados:', transformedGroups);
      
      if (transformedGroups.length === 0) {
        toast('Nenhum grupo encontrado nesta instância');
      }
      
      setGroups(transformedGroups);
      setStep(2);
    } catch (error: any) {
      console.error('Erro ao carregar grupos:', error);
      console.error('Detalhes do erro:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Erro ao carregar grupos do WhatsApp';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setGroups(groups.map(g => 
      g.id === groupId ? { ...g, selected: !g.selected } : g
    ));
  };

  const createNewList = async () => {
    if (!newListName.trim()) {
      toast.error('Digite um nome para a lista');
      return;
    }

    try {
      const user = getCurrentUser();
      
      if (!user) {
        toast.error('Usuário não autenticado. Faça login novamente.');
        return;
      }
      
      // Try to get organizationId from user object or fallback to localStorage direct access
      let organizationId = user.organizationId;
      
      if (!organizationId) {
        // Fallback: Try to parse from localStorage 'user' key directly
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const parsedUser = JSON.parse(userStr);
            organizationId = parsedUser.organizationId;
          }
        } catch (e) {
          console.error('Error parsing user from localStorage', e);
        }
      }

      if (!organizationId) {
        // Last resort: Check auth-storage
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            organizationId = parsed.state?.user?.organizationId;
          }
        } catch (e) {
           console.error('Error parsing auth-storage', e);
        }
      }
      
      if (!organizationId) {

        
        // Final attempt: fetch user profile from API
        try {
            console.log('Fetching user profile directly from API...');
            const profile = await api.get(`${API_URL}auth/me`);
            console.log('API Profile:', profile.data);
            if (profile.data?.user?.organizationId) {
                organizationId = profile.data.user.organizationId;
            } else if (profile.data?.organizationId) {
                organizationId = profile.data.organizationId;
            }
        } catch (apiError) {
            console.error('Failed to fetch user profile:', apiError);
        }
      }

      if (!organizationId) {
        toast.error('Organização não encontrada. Tente fazer logout e login novamente.');
        return;
      }
      
      const response = await api.post(
        `${API_URL}contact-lists`,
        {
          name: newListName,
          description: 'Lista criada via importação de grupos',
          organizationId: organizationId,
        }
      );
      
      setContactLists([...contactLists, response.data]);
      setSelectedList(response.data.id);
      setNewListName('');
      toast.success('Lista criada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar lista:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.details || 'Erro ao criar lista';
      toast.error(errorMsg);
    }
  };

  // Load lists with contact count for the lists tab
  const loadListsWithCount = async () => {
    try {
      const user = getCurrentUser();
      if (!user) return;

      const response = await api.get(`${API_URL}contact-lists`, {
        params: { organizationId: user.organizationId, includeCount: true },
      });
      
      setContactLists(response.data);
    } catch (error) {
      console.error('Erro ao carregar listas:', error);
      toast.error('Erro ao carregar listas');
    }
  };

  // View contacts from a specific list
  const viewListContacts = async (list: ContactList) => {
    try {
      setLoadingContacts(true);
      setViewingList(list);

      const response = await api.get(`${API_URL}contact-lists/${list.id}/contacts`);
      setListContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Erro ao carregar contatos da lista:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setLoadingContacts(false);
    }
  };

  // Export list contacts to CSV
  const exportListToCSV = (list: ContactList, contacts: Contact[]) => {
    try {
      const csvHeaders = ['Nome', 'Telefone', 'Plataforma', 'Tags'];
      const csvRows = contacts.map(contact => [
        contact.name,
        contact.phone || '',
        contact.platform,
        contact.tags.join(', ')
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${list.name}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Lista "${list.name}" exportada com sucesso!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar lista');
    }
  };

  // Helper: Extract phone from WhatsApp ID with smart parsing
  const extractPhone = (participantId: string): string | null => {
    if (!participantId) return null;
    
    // 1. Remove @s.whatsapp.net or @c.us
    let phone = participantId.split('@')[0];
    
    // 2. Remove :XX suffix if present
    if (phone.includes(':')) {
        phone = phone.split(':')[0];
    }
    
    // 3. Remove non-numeric characters
    let cleanPhone = phone.replace(/\D/g, '');
    
    // 4. Lógica "Inteligente" baseada no script do usuário
    // Se for muito longo (> 13 dígitos) e não começar com 55, tenta achar o 55 no meio
    // Isso corrige casos onde vem lixo antes do número (ex: 105548...)
    if (cleanPhone.length > 13 && !cleanPhone.startsWith('55')) {
        const idx55 = cleanPhone.indexOf('55');
        if (idx55 >= 0) {
            // Verifica se o que vem depois do 55 tem tamanho razoável (10 a 11 dígitos + 2 do 55 = 12 a 13)
            const candidate = cleanPhone.substring(idx55);
            if (candidate.length >= 12 && candidate.length <= 13) {
                cleanPhone = candidate;
            }
        }
    }

    // Validate minimum length (10 digits)
    if (cleanPhone.length < 10) {
      return null;
    }
    
    return cleanPhone;
  };

  const handleImport = async () => {
    const selectedGroups = groups.filter(g => g.selected);
    
    if (selectedGroups.length === 0) {
      toast.error('Selecione pelo menos um grupo');
      return;
    }
    
    if (!selectedList) {
      toast.error('Selecione ou crie uma lista de destino');
      return;
    }

    try {
      setImporting(true);
      const token = getAccessToken();
      const user = getCurrentUser();
      
      if (!token || !user) {
        toast.error('Você precisa fazer login novamente');
        return;
      }
      
      let totalImported = 0;
      let totalContacts = 0;
      let totalSkipped = 0;
      
      // Para cada grupo selecionado
      for (const group of selectedGroups) {
        try {
          // Skip communities (only import groups)
          if (!group.id.endsWith('@g.us') || group.id.includes('@newsletter')) {
            console.log(`Pulando comunidade/canal: ${group.name}`);
            totalSkipped++;
            continue;
          }
          
          console.log(`Importando grupo: ${group.name}`);
          
          // 1. Buscar participantes do grupo via Evolution API
          const encodedGroupId = encodeURIComponent(group.id);
          console.log(`[GroupImport] Fetching participants. ID: ${group.id} Encoded: ${encodedGroupId}`);
          
          const participantsResponse = await api.get(
            `integrations/${selectedIntegration}/groups/${encodedGroupId}/participants`
          );
          
          console.log('Resposta participantes:', participantsResponse.data);
          
          // Handle nested participants structure
          let participantsData = participantsResponse.data;
          
          // If response has participants.participants
          if (participantsData.participants && typeof participantsData.participants === 'object') {
            participantsData = participantsData.participants;
          }
          
          // Get the participants array
          let participants = participantsData.participants || participantsData || [];
          
          // Ensure it's an array
          if (!Array.isArray(participants)) {
            console.warn('Participants is not an array:', participants);
            continue;
          }
          
          console.log(`Encontrados ${participants.length} participantes no grupo ${group.name}`);
          
          if (participants.length === 0) {
            console.log(`Grupo ${group.name} está vazio, pulando...`);
            continue;
          }
          
          // 2. Processar e validar participantes
          const validContacts = participants
            .map((participant: any) => {
              // 1. Fonte de Dados: Prioridade Absoluta para remoteJidAlt
              const rawId = participant.remoteJidAlt || participant.remoteJid || participant.id || '';
              
              // 2. Limpeza Inteligente
              const phone = extractPhone(rawId);
              
              if (!phone) {
                return null;
              }

              // 3. FILTRO RIGOROSO: Apenas BRASIL (55)
              // "Tudo o que for fora disso é errado"
              if (!phone.startsWith('55')) {
                 return null;
              }

              // Melhor lógica de extração de nome
              const rawName = participant.pushName || participant.pushname || participant.notify || participant.name || '';
              
              // Formatação visual
              let formattedPhone = '';
              if (phone.startsWith('55') && phone.length > 10) {
                 // Formato Brasil: +55 48 99999-8888
                 formattedPhone = `+${phone.slice(0, 2)} ${phone.slice(2, 4)} ${phone.slice(4)}`;
              } else {
                 // Formato Internacional Genérico (SEMESPAÇOS para diferenciar)
                 formattedPhone = `+${phone}`;
              }
              
              const displayName = rawName.trim() ? rawName : formattedPhone;

              return {
                name: displayName,
                phone: phone, // Numérico limpo para DB
                email: null,
                avatar: participant.picture || participant.profilePictureUrl || null,
                platform: 'WHATSAPP',
                platformId: rawId,
                tags: [group.name],
                organizationId: user.organizationId,
              };
            })
            .filter((contact: any) => contact !== null);
          
          console.log(`${validContacts.length} contatos válidos de ${participants.length} participantes`);
          
          if (validContacts.length === 0) {
            console.log(`Nenhum contato válido no grupo ${group.name}`);
            continue;
          }
          
          // 3. Em vez de importar direto, abrir o modal de preview
          console.log('--- PREVIEW IMPORT ---');
          console.log('Preview Contacts:', validContacts.length);
          
          setPreviewContacts(validContacts);
          setCurrentImportGroup(group.name);
          setShowPreviewModal(true);
          setImporting(false); 
          return; // Para aqui e aguarda confirmação do usuário

        } catch (groupError: any) {
          console.error(`Erro ao importar grupo ${group.name}:`, groupError);
          toast.error(`Erro no grupo "${group.name}": ${groupError.response?.data?.error || groupError.message}`);
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar participantes:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Erro ao processar importação';
      toast.error(errorMsg);
    } finally {
      if (!showPreviewModal) {
          setImporting(false);
      }
    }
  };

  const confirmImport = async () => {
    try {
      if (!selectedList) {
         toast.error('Erro: Nenhuma lista selecionada');
         return;
      }

      setImporting(true);
      
      console.log('--- CONFIRM IMPORT ---');
      console.log('Sending to backend...');

      // 3. Importar contatos em lote (Agora sim!)
      await api.post(
        `${API_URL}contacts/import`,
        {
          contacts: previewContacts,
          listId: selectedList,
        }
      );
      
      const totalContacts = previewContacts.length;
      
      const message = `✅ Grupo "${currentImportGroup}" importado com sucesso!\n` +
                     `📱 Total: ${totalContacts} contatos salvos no banco de dados.`;
      
      toast.success(message, { duration: 5000 });
      
      // Refresh lists count
      loadListsWithCount();
      
      // Close modal and reset
      setShowPreviewModal(false);
      setPreviewContacts([]);
      
      // Optionally switch to lists tab to show result
      setActiveTab('lists');

    } catch (error: any) {
      console.error('Erro ao confirmar importação:', error);
      toast.error('Erro ao salvar no banco de dados: ' + (error.response?.data?.error || error.message));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Importar Grupos WhatsApp</h1>
        <p className="text-slate-500">Importe contatos dos seus grupos do WhatsApp</p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-4 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('import');
            setViewingList(null);
          }}
          className={`pb-4 px-6 font-semibold transition-all ${
            activeTab === 'import'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Importar Grupos
        </button>
        <button
          onClick={() => setActiveTab('lists')}
          className={`pb-4 px-6 font-semibold transition-all ${
            activeTab === 'lists'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Minhas Listas ({contactLists.length})
        </button>
      </div>

      {/* Import Tab Content */}
      {activeTab === 'import' && (
        <>
          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-orange-500' : 'text-slate-300'}`}>
          {step > 1 ? <CheckCircle2 size={24} /> : <Circle size={24} />}
          <span className="font-medium">Selecionar Instância</span>
        </div>
        <ArrowRight className="text-slate-300" size={20} />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-orange-500' : 'text-slate-300'}`}>
          {step > 2 ? <CheckCircle2 size={24} /> : <Circle size={24} />}
          <span className="font-medium">Escolher Grupos</span>
        </div>
        <ArrowRight className="text-slate-300" size={20} />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-orange-500' : 'text-slate-300'}`}>
          {step > 3 ? <CheckCircle2 size={24} /> : <Circle size={24} />}
          <span className="font-medium">Selecionar Lista</span>
        </div>
      </div>

      {/* Step 1: Select Integration */}
      {step === 1 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Selecione uma Instância WhatsApp</h2>
          
          {integrations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto mb-4 text-slate-300" size={48} />
              <p className="text-slate-500 mb-4">Nenhuma instância WhatsApp conectada</p>
              <a 
                href="/#/integrations" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all"
              >
                Conectar Instância
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => {
                    setSelectedIntegration(integration.id);
                    loadGroups(integration.id);
                  }}
                  disabled={loading}
                  className={`p-6 border-2 rounded-2xl transition-all text-left ${
                    selectedIntegration === integration.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:border-orange-500 hover:bg-orange-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                      {loading && selectedIntegration === integration.id ? (
                        <Loader2 className="text-green-600 animate-spin" size={24} />
                      ) : (
                        <Users className="text-green-600" size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{integration.name}</h3>
                      <p className="text-sm text-green-600">
                        {loading && selectedIntegration === integration.id ? 'Carregando grupos...' : 'Conectado'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Groups */}
      {step === 2 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Selecione os Grupos para Importar</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto mb-4 text-orange-500 animate-spin" size={48} />
              <p className="text-slate-500">Carregando grupos...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => toggleGroupSelection(group.id)}
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                      group.selected 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={group.selected}
                          onChange={() => {}}
                          className="w-5 h-5 rounded"
                        />
                        <div>
                          <h3 className="font-bold text-slate-900">{group.name}</h3>
                          <p className="text-sm text-slate-500">{group.participantCount} participantes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={groups.filter(g => g.selected).length === 0}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar ({groups.filter(g => g.selected).length} selecionados)
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Select/Create List */}
      {step === 3 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Selecione a Lista de Destino</h2>
          
          {/* Create New List */}
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
            <h3 className="font-bold text-slate-900 mb-3">Criar Nova Lista</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Nome da nova lista"
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 outline-none"
              />
              <button
                onClick={createNewList}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all"
              >
                <Plus size={20} />
                Criar
              </button>
            </div>
          </div>

          {/* Existing Lists */}
          <div className="space-y-3 mb-6">
            <h3 className="font-bold text-slate-900 mb-3">Ou Selecione uma Lista Existente</h3>
            {contactLists.length === 0 ? (
              <p className="text-slate-500 text-center py-6">Nenhuma lista criada ainda</p>
            ) : (
              contactLists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => setSelectedList(list.id)}
                  className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                    selectedList === list.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      checked={selectedList === list.id}
                      onChange={() => {}}
                      className="w-5 h-5"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900">{list.name}</h3>
                      {list.description && (
                        <p className="text-sm text-slate-500">{list.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all"
            >
              Voltar
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedList || importing}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Importando...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Importar Contatos
                </>
              )}
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Lists Tab Content */}
      {activeTab === 'lists' && (
        <div>
          {!viewingList ? (
            /* Lists Grid */
            <div className="flex flex-col gap-6">
              <div className="flex justify-end">
                  <button 
                    onClick={loadListsWithCount}
                    className="text-sm text-slate-500 hover:text-orange-500 flex items-center gap-1"
                  >
                    🔄 Atualizar Listas
                  </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contactLists.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Users className="mx-auto mb-4 text-slate-300" size={48} />
                  <p className="text-slate-500 mb-4">Nenhuma lista criada ainda</p>
                  <button
                    onClick={() => setActiveTab('import')}
                    className="px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all"
                  >
                    Importar Primeiro Grupo
                  </button>
                </div>
              ) : (
                contactLists.map((list) => (
                  <div
                    key={list.id}
                    className="p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => viewListContacts(list)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                        <Users className="text-orange-600" size={24} />
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                        {list._count?.contacts || 0} contatos
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{list.name}</h3>
                    {list.description && (
                      <p className="text-slate-500 text-sm">{list.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          ) : (
            /* List Details View */
            <div>
              {/* Back Button and Header */}
              <div className="mb-6 flex items-center justify-between">
                <button
                  onClick={() => setViewingList(null)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all"
                >
                  <ArrowRight className="rotate-180" size={20} />
                  Voltar para listas
                </button>
                <button
                  onClick={() => exportListToCSV(viewingList, listContacts)}
                  disabled={listContacts.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={20} />
                  Exportar CSV
                </button>
              </div>

              {/* List Info */}
              <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{viewingList.name}</h2>
                <p className="text-slate-600">
                  {listContacts.length} contato(s) nesta lista
                </p>
              </div>

              {/* Contacts Table */}
              {loadingContacts ? (
                <div className="text-center py-12">
                  <Loader2 className="mx-auto animate-spin text-orange-500" size={48} />
                  <p className="text-slate-500 mt-4">Carregando contatos...</p>
                </div>
              ) : listContacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto mb-4 text-slate-300" size={48} />
                  <p className="text-slate-500">Nenhum contato nesta lista</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Nome</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Telefone</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Plataforma</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Tags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {listContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-900">{contact.name}</td>
                          <td className="px-6 py-4 text-slate-600 font-mono">{contact.phone || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              {contact.platform}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {contact.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Pré-visualização da Importação v6 (Strict Brazil)</h2>
                <p className="text-slate-500">
                  Grupo: <span className="font-semibold text-slate-700">{currentImportGroup}</span> • 
                  {previewContacts.length} contatos encontrados
                </p>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Nome</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Telefone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewContacts.map((contact, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-900 font-medium">{contact.name}</td>
                      <td className="px-6 py-3 text-slate-600 font-mono">{contact.phone}</td>
                      <td className="px-6 py-3">
                         <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                           Válido
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-3 text-slate-600 hover:bg-slate-200 rounded-xl transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Confirmar e Salvar no Banco
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
