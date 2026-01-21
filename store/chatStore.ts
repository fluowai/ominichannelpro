
import { create } from 'zustand';
import { conversationsAPI, api } from '../services/api';
import toast from 'react-hot-toast';

export interface Message {
  id: string;
  conversationId: string;
  text: string;
  sender: 'USER' | 'AGENT' | 'SYSTEM';
  createdAt: string;
  attachments?: any;
  mediaType?: string;
  mediaUrl?: string;
  mediaFilename?: string;
  mediaSize?: number;
  mediaMimeType?: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  contact: {
    name: string;
    phone?: string;
    avatar?: string;
    platform: string;
    platformId?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  status: 'OPEN' | 'PENDING' | 'RESOLVED';
  updatedAt: string;
  integrationId?: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  socket: WebSocket | null;
  selectedInstance: string | null;
  selectedChannel: string | null;
  reconnectAttempts: number;
  isConnecting: boolean;
  
  setFilter: (instanceId: string | null, channel: string | null) => void;
  
  fetchConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (text: string, attachments?: any[]) => Promise<void>;
  uploadFile: (file: File) => Promise<any>;
  connectWebSocket: (token: string, userId: string) => void;
  disconnectWebSocket: () => void;
  addMessage: (message: Message) => void;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  socket: null,
  selectedInstance: null,
  selectedChannel: null,
  reconnectAttempts: 0,

  setFilter: (instanceId, channel) => {
    set({ selectedInstance: instanceId, selectedChannel: channel });
    get().fetchConversations();
  },


  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    const { selectedInstance, selectedChannel } = get();
    try {
      const params: any = {};
      
      if (selectedInstance) {
        params.integrationId = selectedInstance;
      } else if (selectedChannel) {
        params.platform = selectedChannel;
      }

      const { data } = await conversationsAPI.getAll(params);
      
      const mappedConversations = data.conversations.map((c: any) => ({
        ...c,
        lastMessage: Array.isArray(c.messages) ? c.messages[0] : (c.lastMessage || null)
      }));

      set({ 
        conversations: mappedConversations,
        isLoadingConversations: false 
      });
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      set({ isLoadingConversations: false });
    }
  },

  selectConversation: async (id) => {
    set({ activeConversationId: id, isLoadingMessages: true });
    try {
      const { data } = await conversationsAPI.getById(id);
      set({ 
        messages: data.conversation.messages,
        isLoadingMessages: false,
        conversations: get().conversations.map(c => 
          c.id === id ? { ...c, unreadCount: 0 } : c
        )
      });
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      set({ isLoadingMessages: false });
    }
  },

  uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
  },

  sendMessage: async (text, attachments) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    try {
      await conversationsAPI.sendMessage(activeConversationId, { text, attachments });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  },

  addMessage: (message) => {
    set(state => {
      // 0. REACTIVE FILTER - RELAXED
      // We only strictly filter if it's from a different instance AND we are in "Global Mode" (no active convo).
      // If we are looking at a specific active conversation, we trust the backend/socket to send relevant msgs.
      const { selectedInstance, activeConversationId } = get();
      
      // If we have an active conversation, ignore the global filter for this message 
      // (Safety: maybe the user switched filters but is still looking at the chat)
      if (selectedInstance && !activeConversationId) {
        const conversation = state.conversations.find(c => c.id === message.conversationId);
        if (conversation && conversation.integrationId !== selectedInstance) {
          // console.log('[Store] Filtered message (Global View)...');
          return state; 
        }
      }

      // 1. Strict Deduplication by ID
      if (state.messages.some(m => m.id === message.id)) {
        return state;
      }
      
      // 2. Fuzzy Deduplication (Prevent echo from own send)
      // If we have a message with same text sent < 2 seconds ago by same sender, likely double event
      const isDuplicateEcho = state.messages.some(m => 
        m.text === message.text && 
        m.sender === message.sender &&
        Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 2000
      );

      if (isDuplicateEcho) {
         console.log('[Store] duplicate echo filtered:', message.id);
         return state;
      }

      // 3. Update Conversation List (Move to top)
      const otherConversations = state.conversations.filter(c => c.id !== message.conversationId);
      const targetConversation = state.conversations.find(c => c.id === message.conversationId);
      
      let updatedConversations = state.conversations;
      
      if (targetConversation) {
          updatedConversations = [
              { ...targetConversation, lastMessage: message, updatedAt: message.createdAt, unreadCount: targetConversation.unreadCount + (state.activeConversationId === message.conversationId ? 0 : 1) },
              ...otherConversations
          ];
      } else {
          // New conversation? Fetch to be safe
           get().fetchConversations();
      }

      // 4. Update Messages (ONLY if active)
      let newMessages = state.messages;
      if (state.activeConversationId === message.conversationId) {
          // Strict Deduplication
          if (!state.messages.some(m => m.id === message.id)) {
             newMessages = [...state.messages, message];
          }
      }

      return {
        messages: newMessages,
        conversations: updatedConversations
      };
    });
  },

  deleteMessage: async (conversationId: string, messageId: string) => {
      try {
          await conversationsAPI.deleteMessage(conversationId, messageId);
          // Optimistic update
          set(state => ({
              messages: state.messages.filter(m => m.id !== messageId),
              conversations: state.conversations.map(c => {
                  if (c.id === conversationId && c.lastMessage?.id === messageId) {
                      return { ...c, lastMessage: state.messages[state.messages.length - 2] }; // Fallback roughly
                  }
                  return c;
              })
          }));
      } catch (error) {
          console.error('Erro ao deletar mensagem:', error);
          toast.error('Erro ao deletar mensagem');
      }
  },

  isConnecting: false, // Added state

  connectWebSocket: (token, userId) => {
    const { socket, isConnecting } = get();

    // IDEMPOTENCY: Prevent double/parallel attempts
    if (isConnecting) {
        console.log('[WS_DEBUG] Connection in progress. Skipping duplicate request.');
        return;
    }

    // IDEMPOTENCY: Close existing connection first to prevent duplicates/zombies
    if (socket) {
         console.log('[WS_DEBUG] Closing existing connection before new attempt.');
         get().disconnectWebSocket(); 
    }

    // LOCK
    set({ isConnecting: true });

    // DYNAMIC WS URL: Adapts to dev (ws://) or prod (wss://)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';
    
    // Parse hostname from the corrected/raw URL
    let wsHost;
    let wsProtocol = 'ws'; // Default local

    try {
        // Handle case where user provided URL without protocol (e.g. "myapp.railway.app")
        const safeUrl = apiUrl.startsWith('http') ? apiUrl : `https://${apiUrl}`;
        const urlObj = new URL(safeUrl);
        
        wsHost = urlObj.host; // domain:port
        wsProtocol = safeUrl.startsWith('https') ? 'wss' : 'ws';
    } catch (e) {
        console.error('[WS] Failed to parse API URL, falling back to localhost', e);
        wsHost = 'localhost:3333';
    }

    const wsUrl = `${wsProtocol}://${wsHost}/ws/chat?token=${token}&userId=${userId}`;
    console.log('[WS_DEBUG] Attempting connection to:', wsUrl.split('?')[0]); 
    
    let newSocket: WebSocket;
    try {
        newSocket = new WebSocket(wsUrl);
    } catch (e) {
        console.error('[WS_DEBUG] Socket creation failed:', e);
        set({ isConnecting: false });
        return;
    }

    newSocket.onopen = () => {
      console.log('[WS_DEBUG] WebSocket connected successfully');
      set({ 
          reconnectAttempts: 0,
          isConnecting: false,
          socket: newSocket // Set socket only on success open to be safe? No, we need it for cleanup.
      }); 
      
      // SYNC ON CONNECT
      get().fetchConversations();
      const { activeConversationId, selectConversation } = get();
      if (activeConversationId) {
          selectConversation(activeConversationId);
      }
    };

    newSocket.onerror = (error) => {
      console.error('[WS_DEBUG] WebSocket error:', error);
      set({ isConnecting: false });
    };

    newSocket.onclose = (event) => {
       console.log('[WS_DEBUG] WebSocket closed. Code:', event.code, 'Reason:', event.reason);
       set({ isConnecting: false }); // Unlock on close
       
       // Handle Intentional Close explicitly
       if (!get().socket) return;

       if (event.code !== 1000) {
           // Exponential Backoff
           const { reconnectAttempts } = get();
           const nextDelay = Math.min(3000 * Math.pow(2, reconnectAttempts), 30000); 
           
           console.log(`[WS_DEBUG] Connection lost (${event.code}). Reconnecting in ${nextDelay}ms (Attempt ${reconnectAttempts + 1})`);
           
           set({ socket: null, reconnectAttempts: reconnectAttempts + 1 });
           
           setTimeout(() => {
               console.log('[WS_DEBUG] Auto-reconnecting...');
               get().connectWebSocket(token, userId);
           }, nextDelay);
       }
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WS_DEBUG] Received:', data); 
        
        if (data === 'pong') {
             console.log('[WS_DEBUG] Pong received');
             return;
        }

        if (data.type === 'message_deleted') {
            set(state => ({
                messages: state.messages.filter(m => m.id !== data.messageId)
            }));
            return;
        }

        if (data.type === 'new_message') {
             const preview = data.message?.text?.substring(0,20);
             console.log(`[WS_DEBUG] Message Arrived. Text: "${preview}" IntegrationID: ${data.integrationId}`);
             const { activeConversationId } = get();
             if (data.conversationId !== activeConversationId) {
                toast.success(`Nova mensagem: ${preview}...`);
             }
        }

        if (data.type === 'message' || data.type === 'new_message') {
          const { addMessage } = get();
          addMessage(data.message);
        }
      } catch (e) {
        console.error('Erro no WebSocket:', e);
      }
    };

    // Set socket immediately so we can close it if needed, but isConnecting protects us
    set({ socket: newSocket });
  },

  disconnectWebSocket: () => {
    const { socket } = get();
    if (socket) {
      // PREVENT AUTO-RECONNECT
      // We must clear the onclose handler so it doesn't trigger the 3s retry
      socket.onclose = null; 
      socket.close();
      set({ socket: null });
    }
  }
}));
