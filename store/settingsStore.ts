import { create } from 'zustand';
import { api } from '../services/api'; // Assuming api.ts exports the axios instance

export interface SystemSettings {
  evolution_api?: {
    baseUrl: string;
    globalApiKey: string;
  };
  [key: string]: any;
}

interface SettingsStore {
  settings: SystemSettings;
  isLoading: boolean;
  
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: any, description?: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: {},
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/settings');
      set({ settings: data });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateSetting: async (key: string, value: any, description?: string) => {
    try {
      await api.post('/settings', { key, value, description });
      // Update local state optimistic or fetch again
      set((state) => ({
        settings: { ...state.settings, [key]: value }
      }));
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  }
}));
