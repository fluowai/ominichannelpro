import React from 'react';
import { User, Phone, Mail, Calendar, Tag, ChevronDown } from 'lucide-react';

interface ContactPanelProps {
  contact?: {
    name: string;
    phone?: string;
    email?: string;
    avatar?: string;
    platform: string;
    platformId?: string;
  };
  conversation?: {
    id: string;
    status: string;
    createdAt: string;
    assignedTo?: {
      name: string;
      avatar?: string;
    };
  };
}

// Formata números removendo sufixos do WhatsApp e aplicando formato brasileiro
const formatPhone = (value?: string): string => {
  if (!value) return 'Não disponível';
  
  // Remove sufixo @s.whatsapp.net, @lid, @g.us, etc
  let clean = value.split('@')[0].replace(/\D/g, '');
  
  // Se está vazio após limpeza, retorna original
  if (!clean) return value;
  
  // FORMATO BRASILEIRO COMPLETO: +55 (DD) 9XXXX-XXXX (13 dígitos com 55)
  if (clean.length === 13 && clean.startsWith('55')) {
    const country = clean.substring(0, 2);
    const ddd = clean.substring(2, 4);
    const part1 = clean.substring(4, 9);
    const part2 = clean.substring(9, 13);
    return `+${country} (${ddd}) ${part1}-${part2}`;
  }
  
  // FORMATO BRASILEIRO SEM 9: +55 (DD) XXXX-XXXX (12 dígitos com 55)
  if (clean.length === 12 && clean.startsWith('55')) {
    const country = clean.substring(0, 2);
    const ddd = clean.substring(2, 4);
    const part1 = clean.substring(4, 8);
    const part2 = clean.substring(8, 12);
    return `+${country} (${ddd}) ${part1}-${part2}`;
  }
  
  // FORMATO SEM CÓDIGO DO PAÍS: (DD) 9XXXX-XXXX (11 dígitos)
  if (clean.length === 11) {
    const ddd = clean.substring(0, 2);
    const part1 = clean.substring(2, 7);
    const part2 = clean.substring(7, 11);
    return `(${ddd}) ${part1}-${part2}`;
  }
  
  // FORMATO SEM CÓDIGO DO PAÍS E SEM 9: (DD) XXXX-XXXX (10 dígitos)
  if (clean.length === 10) {
    const ddd = clean.substring(0, 2);
    const part1 = clean.substring(2, 6);
    const part2 = clean.substring(6, 10);
    return `(${ddd}) ${part1}-${part2}`;
  }
  
  // NÚMERO INVÁLIDO/CORROMPIDO (muito longo ou muito curto)
  // Mostra formatado em blocos de 4 para facilitar leitura
  if (clean.length > 13 || clean.length < 10) {
    const blocks = clean.match(/.{1,4}/g) || [clean];
    return blocks.join(' ');
  }
  
  // Fallback: retorna limpo
  return clean;
};


const ContactPanel: React.FC<ContactPanelProps> = ({ contact, conversation }) => {
  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {!contact ? (
        <div className="p-8 text-center">
          <div className="mt-20">
            <User size={56} className="mx-auto mb-4 text-gray-300" />
            <p className="text-base font-semibold text-gray-700">Selecione uma conversa</p>
            <p className="text-sm text-gray-500 mt-2">para ver os detalhes</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header com gradiente laranja */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-orange-50 to-white">
            <div className="flex flex-col items-center">
              {contact.avatar ? (
                <img 
                  src={contact.avatar} 
                  alt={contact.name} 
                  className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-orange-200 shadow-lg" 
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-3xl font-bold mb-4 shadow-xl">
                  {contact.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{contact.name}</h3>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                {contact.platform}
              </span>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Informações de Contato */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  Informações de Contato
                </h4>
              </div>
              
              <div className="space-y-4">
                {contact.email && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-600 mb-1">Email</p>
                      <p className="text-sm font-semibold text-gray-900 break-all">{contact.email}</p>
                    </div>
                  </div>
                )}
                
                {contact.phone && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-600 mb-1">Telefone</p>
                      <p className="text-base font-bold text-gray-900">{formatPhone(contact.phone)}</p>
                    </div>
                  </div>
                )}

                {contact.platformId && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <User size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-600 mb-1">WhatsApp</p>
                      <p className="text-base font-bold text-gray-900">{formatPhone(contact.platformId)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  Ações da Conversa
                </h4>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-200 rounded-lg transition-all shadow-sm">
                <span className="text-sm font-bold text-gray-900">Ações</span>
                <ChevronDown size={18} className="text-orange-600" />
              </button>
            </div>

            {/* Agente */}
            {conversation?.assignedTo && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    Agente Atribuído
                  </h4>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  {conversation.assignedTo.avatar ? (
                    <img src={conversation.assignedTo.avatar} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                      {conversation.assignedTo.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-bold text-gray-900">{conversation.assignedTo.name}</span>
                </div>
              </div>
            )}

            {/* Info da Conversa */}
            {conversation && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    Informações da Conversa
                  </h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-1">Iniciado em</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(conversation.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Tag size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                        conversation.status === 'OPEN' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                        conversation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                        'bg-gray-100 text-gray-800 border-2 border-gray-300'
                      }`}>
                        {conversation.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};

export default ContactPanel;
