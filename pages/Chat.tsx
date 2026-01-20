
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Search, 
  Phone, 
  Video, 
  Check, 
  CheckCheck,
  Bot,
  User,
  Image as ImageIcon,
  FileText,
  Mic,
  X,
  MessageSquare,
  Download,
  Filter,
  Trash2,
  Instagram,
  MessageCircle
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { integrationsAPI } from '../services/api';
import toast from 'react-hot-toast';
import ContactPanel from '../components/chat/ContactPanel';
import { useIntegrationsStore } from '../store/integrationsStore';


const Chat: React.FC = () => {
  const { 
    conversations, 
    activeConversationId, 
    messages, 
    isLoadingConversations,
    isLoadingMessages,
    fetchConversations, 
    selectConversation, 
    sendMessage,
    deleteMessage
  } = useChatStore();
  
  const { checkIntegrationStatus } = useIntegrationsStore();
  
  const { accessToken } = useAuthStore();
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [integrations, setIntegrations] = useState<any[]>([]);
  const { selectedInstance, selectedChannel, setFilter } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak, enabled: ttsEnabled, toggle: toggleTts, isSpeaking } = useTextToSpeech();
  const lastReadMessageId = useRef<string | null>(null);

  // Auto-read new messages
  useEffect(() => {
    if (!ttsEnabled || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if ((lastMessage.sender === 'AGENT' || lastMessage.sender === 'SYSTEM') && lastMessage.id !== lastReadMessageId.current) {
        speak(lastMessage.text);
        lastReadMessageId.current = lastMessage.id;
    }
  }, [messages, ttsEnabled, speak]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeConversationId]);


  useEffect(() => {
    // Load conversations immediately on mount
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const { data } = await integrationsAPI.getAll();
        setIntegrations(data.integrations);
      } catch (error) {
        console.error('Failed to load integrations', error);
      }
    };
    loadIntegrations();
  }, []);

  // Background check for inactive connections
  useEffect(() => {
    if (integrations.length > 0) {
        integrations.forEach(int => {
            if (int.status !== 'CONNECTED' && (int.type === 'EVOLUTION_API' || int.type.includes('WHATSAPP'))) {
                console.log('[Chat] Background re-check for:', int.name);
                checkIntegrationStatus(int.id).catch(() => {}); // Silent catch
            }
        });
    }
  }, [integrations, checkIntegrationStatus]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const filteredConversations = conversations
    .filter(c => {
      // 1. Search Term
      const matchesSearch = c.contact.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Filter Groups & Newsletters (Already cleared in DB but good for safety)
      const isGroup = c.contact?.platformId?.endsWith('@g.us') || false;
      const isNewsletter = c.contact?.platformId?.endsWith('@newsletter') || false;
      
      return matchesSearch && !isGroup && !isNewsletter;
    })
    // 3. Remove duplicates by contactId (keep most recent)
    .reduce((acc: any[], current) => {
      const existing = acc.find(c => c.contactId === current.contactId);
      if (!existing) {
        acc.push(current);
      } else if (new Date(current.updatedAt) > new Date(existing.updatedAt)) {
        const index = acc.indexOf(existing);
        acc[index] = current;
      }
      return acc;
    }, []);

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (e) {
      return '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId) return;

    try {
      await sendMessage(newMessage);
      setNewMessage('');
      // Scroll to bottom?
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white font-['Poppins']">
      
      {/* Sidebar - Contacts List */}
      <div className="w-[340px] border-r border-slate-100 flex flex-col bg-white">
        <div className="p-5 pb-3">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-3xl font-bold text-slate-900">Conversas</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-semibold">
                {conversations.length}
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 space-y-2">
            <select 
              className="w-full bg-slate-50 border-none rounded-lg px-3 py-3 text-base font-medium text-slate-700 focus:ring-1 focus:ring-orange-200 outline-none"
              value={selectedInstance || ''}
              onChange={(e) => setFilter(e.target.value || null, selectedChannel)}
            >
              <option value="">Todas as Instâncias</option>
              {integrations.map((int) => (
                <option key={int.id} value={int.id}>
                  {int.name}
                </option>
              ))}
            </select>
            <select 
              className="w-full bg-slate-50 border-none rounded-lg px-3 py-3 text-base font-medium text-slate-700 focus:ring-1 focus:ring-orange-200 outline-none"
              value={selectedChannel || ''}
              onChange={(e) => setFilter(selectedInstance, e.target.value || null)}
            >
              <option value="">Todos os Canais</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="MESSENGER">Messenger</option>
            </select>
          </div>

          <div className="relative mb-4 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar conversas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-1.5 custom-scrollbar">
          {isLoadingConversations ? (
            <div className="text-center py-10 text-slate-400">Carregando...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-10 text-slate-400">Nenhuma conversa encontrada</div>
          ) : (
            filteredConversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => selectConversation(chat.id)}
                className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 group ${
                  activeConversationId === chat.id 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="relative">
                  {chat.contact.avatar ? (
                    <img src={chat.contact.avatar} alt="" className="w-11 h-11 rounded-xl object-cover" />
                  ) : (
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold ${
                      activeConversationId === chat.id ? 'bg-white/10 text-white' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {chat.contact.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  {chat.status === 'OPEN' && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-10"></span>
                  )}
                  
                  {/* Platform Icon */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 z-20">
                    {chat.contact.platform === 'INSTAGRAM' ? (
                       <Instagram size={12} className="text-[#E1306C]" />
                    ) : (
                       <MessageCircle size={12} className="text-[#25D366]" />
                    )}
                  </div>
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-semibold truncate text-[15px] ${
                      activeConversationId === chat.id ? 'text-white' : 'text-slate-900'
                    }`}>
                      {chat.contact?.name || 'Sem Nome'}
                    </h3>
                    <span className={`text-xs font-medium ${
                      activeConversationId === chat.id ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {formatDate(chat.updatedAt)}
                    </span>
                  </div>
                  <p className={`text-[14px] truncate leading-tight ${
                    activeConversationId === chat.id ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {chat.lastMessage?.text || 'Nova conversa'}
                  </p>
                </div>

                {chat.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {chat.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {activeConversationId && activeConversation ? (
          <>
            {/* Chat Header - WhatsApp Style */}
            <div className="h-[60px] px-4 bg-[#F0F2F5] border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {activeConversation.contact.avatar ? (
                    <img src={activeConversation.contact.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-semibold">
                      {activeConversation.contact.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 text-[16px] leading-tight">{activeConversation.contact.name}</h3>
                  <p className="text-xs text-slate-500">online</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleTts}
                  className={`p-2 rounded-full transition-all flex items-center justify-center ${
                    ttsEnabled ? 'bg-orange-100 text-orange-600' : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                  title={ttsEnabled ? 'Voz ativada (clique para desativar)' : 'Voz desativada (clique para ativar)'}
                >
                  {isSpeaking ? (
                    <div className="flex gap-0.5 items-center">
                      <div className="w-1 h-3 bg-orange-500 animate-pulse"></div>
                      <div className="w-1 h-5 bg-orange-500 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-3 bg-orange-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  ) : (
                    <Mic size={20} className={ttsEnabled ? 'fill-orange-600' : ''} />
                  )}
                </button>
                <button className="p-2 text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                  <Search size={20} />
                </button>
                <button className="p-2 text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area - WhatsApp Style */}
            <div 
              className="flex-1 overflow-y-auto p-4 custom-scrollbar relative"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9d9d9' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: '#E5DDD5'
              }}
            >
              {isLoadingMessages ? (
                <div className="flex justify-center p-10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center max-w-md">
                    <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare size={40} className="text-teal-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhuma mensagem ainda</h3>
                    <p className="text-sm text-slate-500">Envie uma mensagem para iniciar a conversa</p>
                  </div>
                </div>
              ) : (
                <div className="w-full mx-auto min-h-full flex flex-col pt-4">
                  {messages.map((message, index) => {
                    const isMe = message.sender === 'AGENT' || message.sender === 'SYSTEM';
                    const prevMessage = messages[index - 1];
                    const nextMessage = messages[index + 1];
                    const showTail = !nextMessage || nextMessage.sender !== message.sender;
                    const isFirstInGroup = !prevMessage || prevMessage.sender !== message.sender;
                    
                    // Group messages by date
                    const messageDate = new Date(message.createdAt).toLocaleDateString('pt-BR');
                    const prevDate = prevMessage ? new Date(prevMessage.createdAt).toLocaleDateString('pt-BR') : null;
                    const showDateDivider = messageDate !== prevDate;

                    return (
                      <React.Fragment key={message.id}>
                        {/* Date Divider */}
                        {showDateDivider && (
                          <div className="flex justify-center my-3">
                            <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-sm">
                              <span className="text-xs font-medium text-slate-600">
                                {messageDate === new Date().toLocaleDateString('pt-BR') ? 'HOJE' : messageDate}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Message */}
                        <div 
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1.5 animate-fadeIn ${index === 0 && !showDateDivider ? 'mt-0' : ''}`}
                          style={{ animationDelay: `${index * 0.02}s` }}
                        >
                          <div className={`group relative max-w-[85%] ${isFirstInGroup ? 'mt-4' : ''}`}>
                            {/* Message Bubble */}
                            <div 
                              className={`px-4 py-2.5 shadow-sm relative ${
                                isMe 
                                  ? 'bg-[#D9FDD3] rounded-lg' 
                                  : 'bg-white rounded-lg'
                              } ${showTail ? (isMe ? 'rounded-br-none' : 'rounded-bl-none') : ''}`}
                            >
                              {/* Delete Button */}
                              {isMe && (
                                <button 
                                  onClick={() => {
                                    if (confirm('Apagar mensagem?')) {
                                      deleteMessage(activeConversationId!, message.id);
                                    }
                                  }}
                                  className="absolute -top-2 -left-2 p-1.5 rounded-full bg-white shadow-md text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                                  title="Apagar mensagem"
                                  type="button"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                              
                              {/* Sender Name */}
                              {!isMe && (
                                <p className="text-xs font-semibold text-orange-600 mb-1">
                                  {activeConversation?.contact?.name || activeConversation?.contact?.phone || 'Contato'}
                                </p>
                              )}
                              
                              {/* Media Content */}
                              {(message as any).mediaType && (
                                <div className="mb-2">
                                  {/* Image */}
                                  {(message as any).mediaType === 'image' && (
                                    <img 
                                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${(message as any).mediaUrl}`}
                                      alt="Imagem"
                                      className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '')}${(message as any).mediaUrl}`, '_blank')}
                                    />
                                  )}
                                  
                                  {/* Audio / Voice */}
                                  {((message as any).mediaType === 'audio' || (message as any).mediaType === 'voice') && (
                                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg max-w-xs">
                                      <audio controls className="w-full">
                                        <source src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${(message as any).mediaUrl}`} type={(message as any).mediaMimeType} />
                                      </audio>
                                    </div>
                                  )}
                                  
                                  {/* Video */}
                                  {(message as any).mediaType === 'video' && (
                                    <video controls className="max-w-xs rounded-lg">
                                      <source src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${(message as any).mediaUrl}`} type={(message as any).mediaMimeType} />
                                    </video>
                                  )}
                                  
                                  {/* Document */}
                                  {(message as any).mediaType === 'document' && (
                                    <a 
                                      href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${(message as any).mediaUrl}`}
                                      download={(message as any).mediaFilename}
                                      className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors max-w-xs"
                                    >
                                      <FileText size={32} className="text-blue-500 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{(message as any).mediaFilename || 'Documento'}</p>
                                        <p className="text-xs text-gray-500">
                                          {(message as any).mediaSize ? `${Math.round((message as any).mediaSize / 1024)} KB` : 'Download'}
                                        </p>
                                      </div>
                                      <Download size={20} className="text-gray-400 flex-shrink-0" />
                                    </a>
                                  )}
                                </div>
                              )}
                              
                              {/* Message Text */}
                              {message.text && (
                                <p className="text-[16px] text-slate-800 leading-[22px] whitespace-pre-wrap break-words pr-12">
                                  {message.text}
                                </p>
                              )}
                              
                              {/* Timestamp and Status */}
                              <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                <span className="text-[11px] text-slate-500">
                                  {new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && (
                                  <svg viewBox="0 0 16 15" width="16" height="15" className="text-blue-500">
                                    <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
                                  </svg>
                                )}
                              </div>
                            </div>
                            
                            {/* Tail */}
                            {showTail && (
                              <div className={`absolute bottom-0 ${isMe ? '-right-2' : '-left-2'}`}>
                                <svg viewBox="0 0 8 13" height="13" width="8" className={isMe ? 'text-[#D9FDD3]' : 'text-white'}>
                                  <path opacity=".13" d={isMe ? "M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" : "M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"}></path>
                                  <path fill="currentColor" d={isMe ? "M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" : "M1.533 2.568L8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z"}></path>
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - WhatsApp Style */}
            <div className="p-3 bg-[#F0F2F5]">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Action Buttons */}
                <div className="flex gap-1">
                  <button 
                    type="button" 
                    className="p-2 text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
                  >
                    <Smile size={24} />
                  </button>
                  <button 
                    type="button" 
                    className="p-2 text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
                  >
                    <Paperclip size={24} />
                  </button>
                </div>
                
                {/* Input */}
                <div className="flex-1 bg-white rounded-lg px-4 py-2.5 flex items-center">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem"
                    className="flex-1 bg-transparent border-none text-[15px] text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                  />
                </div>

                {/* Send/Mic Button */}
                {newMessage.trim() ? (
                  <button 
                    type="submit"
                    className="p-3 bg-[#00A884] hover:bg-[#008F6D] text-white rounded-full transition-colors shadow-md"
                  >
                    <Send size={20} />
                  </button>
                ) : (
                  <button 
                    type="button"
                    className="p-3 text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
                  >
                    <Mic size={24} />
                  </button>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
              <MessageSquare size={40} className="text-orange-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Selecione uma conversa</h3>
            <p className="max-w-xs text-center text-sm">Escolha um contato na lista ao lado para iniciar o atendimento.</p>
          </div>
        )}
      </div>

      {/* 3rd Column: Contact Panel (à direita) */}
      <ContactPanel 
        contact={activeConversation?.contact}
        conversation={activeConversation ? {
          id: activeConversation.id,
          status: activeConversation.status,
          createdAt: activeConversation.updatedAt
        } : undefined}
      />
    </div>
  );
};

export default Chat;
