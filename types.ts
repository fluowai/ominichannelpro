
export type Platform = 'whatsapp' | 'instagram' | 'messenger';

export interface Agent {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'groq';
  model: string;
  prompt: string;
  status: 'active' | 'inactive';
  temperature: number;
}

export interface Conversation {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: string;
  platform: Platform;
  unreadCount: number;
  avatar?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'me';
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'manager';
}

export interface Integration {
  id: string;
  name: string;
  type: 'evolution_api' | 'instagram_official' | 'instagram_unofficial';
  status: 'connected' | 'disconnected' | 'error';
  apiKey?: string;
  instanceUrl?: string;
}
