
import { create } from 'zustand';
import { integrationsAPI } from '../services/api';

export interface Integration {
  id: string;
  name: string;
  type: 'EVOLUTION_API' | 'WUZAPI' | 'INSTAGRAM_OFFICIAL' | 'INSTAGRAM_UNOFFICIAL' | 'WEBHOOK';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  instanceUrl?: string;
  createdAt: string;
}

interface IntegrationsState {
  integrations: Integration[];
  isLoading: boolean;
  error: string | null;
  fetchIntegrations: () => Promise<void>;
  createIntegration: (data: any) => Promise<Integration>;
  deleteIntegration: (id: string) => Promise<void>;
  connectIntegration: (id: string) => Promise<{ status: string; qrcode?: string; qr?: string }>;
  checkIntegrationStatus: (id: string) => Promise<string | null>;
  updateIntegration: (id: string, data: any) => Promise<void>;
}

export const useIntegrationsStore = create<IntegrationsState>((set, get) => ({
  integrations: [],
  isLoading: false,
  error: null,

  fetchIntegrations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await integrationsAPI.getAll();
      set({ integrations: data.integrations, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Erro ao carregar integrações',
        isLoading: false 
      });
    }
  },

  createIntegration: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await integrationsAPI.create(data);
      set(state => ({ 
        integrations: [response.data.integration, ...state.integrations],
        isLoading: false 
      }));
      return response.data.integration;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Erro ao criar integração',
        isLoading: false 
      });
      throw error;
    }
  },

  connectIntegration: async (id: string) => {
    try {
      const { data } = await integrationsAPI.connect(id);
      return data; // { status: 'CONNECTED' | 'QR_CODE', qrcode?: 'base64...', qr?: 'base64...' }
    } catch (error: any) {
        console.error('Connect error:', error);
        throw error;
    }
  },

  checkIntegrationStatus: async (id: string) => {
      try {
          const { data } = await integrationsAPI.checkStatus(id);
          // Update local status
          set(state => ({
              integrations: state.integrations.map(i => 
                  i.id === id ? { ...i, status: data.status } : i
              )
          }));
          return data.status;
      } catch (error) {
          console.error('Check status error:', error);
          return null;
      }
  },

  deleteIntegration: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await integrationsAPI.delete(id);
      set(state => ({
        integrations: state.integrations.filter(i => i.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Erro ao deletar integração',
        isLoading: false 
      });
      throw error;
    }
  },

  updateIntegration: async (id, data) => {
    try {
      const response = await integrationsAPI.update(id, data);
      set(state => ({
        integrations: state.integrations.map(i => 
          i.id === id ? { ...i, ...response.data.integration } : i
        )
      }));
    } catch (error: any) {
      console.error('Update integration error:', error);
      throw error;
    }
  }
}));
