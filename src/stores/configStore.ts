import { create } from 'zustand';
import { UserConfig } from '../types/config';
import { defaultConfig } from '../config/defaultConfig';
import { ConfigService } from '../services/config';

interface ConfigState {
    config: UserConfig;
    loading: boolean;
    loadConfig: () => Promise<void>;
    saveConfig: (newConfig: Partial<UserConfig>) => Promise<void>;
    resetToDefault: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
    config: defaultConfig,
    loading: false,

    loadConfig: async () => {
        if (get().loading) {
            return;
        }

        set({ loading: true });
        try {
            const finalConfig = await ConfigService.loadConfig();
            set({ config: finalConfig, loading: false });
        } catch (error) {
            console.error('Critical error in loadConfig:', error);
            set({ config: defaultConfig, loading: false });
        }
    },

    saveConfig: async (newConfig: Partial<UserConfig>) => {
        if (get().loading) {
            throw new Error('Config operation already in progress');
        }

        set({ loading: true });
        try {
            const currentConfig = get().config;
            const mergedConfig = { ...currentConfig, ...newConfig };
            await ConfigService.saveConfig(mergedConfig);
            set({ config: mergedConfig, loading: false });
        } catch (error) {
            set({ loading: false });
            console.error('Failed to save config:', error);
            throw error;
        }
    },

    resetToDefault: async () => {
        if (get().loading) {
            throw new Error('Config operation already in progress');
        }

        set({ loading: true });
        try {
            await ConfigService.saveConfig(defaultConfig);
            set({ config: defaultConfig, loading: false });
        } catch (error) {
            console.error('Failed to reset config:', error);
            set({ config: defaultConfig, loading: false });
        }
    },
}));

export default useConfigStore;
