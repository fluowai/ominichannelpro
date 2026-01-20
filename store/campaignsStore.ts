
import { create } from 'zustand';
import { campaignsAPI } from '../services/api';

export interface Campaign {
  id: string;
  name: string;
  platform: 'WHATSAPP' | 'INSTAGRAM' | 'MESSENGER';
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';
  scheduledAt: string | null;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  message: string;
  audience: string;
  createdAt: string;
}

interface CampaignsState {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  fetchCampaigns: () => Promise<void>;
  createCampaign: (data: any) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
}

export const useCampaignsStore = create<CampaignsState>((set, get) => ({
  campaigns: [],
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await campaignsAPI.getAll();
      set({ campaigns: data.campaigns, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Erro ao carregar campanhas',
        isLoading: false 
      });
    }
  },

  createCampaign: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await campaignsAPI.create(data);
      set(state => ({ 
        campaigns: [response.data.campaign, ...state.campaigns],
        isLoading: false 
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Erro ao criar campanha',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteCampaign: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await campaignsAPI.delete(id);
      set(state => ({
        campaigns: state.campaigns.filter(c => c.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Erro ao deletar campanha',
        isLoading: false 
      });
      throw error;
    }
  }
}));
