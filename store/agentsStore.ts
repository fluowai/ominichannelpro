import { create } from 'zustand';
import { agentsAPI } from '../services/api';

export interface Agent {
  id: string;
  name: string;
  provider: 'GEMINI' | 'OPENAI' | 'GROQ';
  model: string;
  prompt: string;
  status: 'ACTIVE' | 'INACTIVE';
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  apiKey?: string;
  skills?: string[];
  ignoreGroups?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AgentsState {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  createAgent: (data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  isLoading: false,
  error: null,

  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await agentsAPI.getAll();
      set({ agents: data.agents, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Erro ao carregar agentes',
        isLoading: false 
      });
    }
  },

  createAgent: async (agentData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await agentsAPI.create(agentData);
      set(state => ({ 
        agents: [data.agent, ...state.agents],
        isLoading: false 
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Erro ao criar agente',
        isLoading: false 
      });
      throw error;
    }
  },

  updateAgent: async (id, agentData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await agentsAPI.update(id, agentData);
      set(state => ({
        agents: state.agents.map(a => a.id === id ? data.agent : a),
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Erro ao atualizar agente',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteAgent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await agentsAPI.delete(id);
      set(state => ({
        agents: state.agents.filter(a => a.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Erro ao deletar agente',
        isLoading: false 
      });
      throw error;
    }
  },
}));
