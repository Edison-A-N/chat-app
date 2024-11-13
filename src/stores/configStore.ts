import { create } from 'zustand';
import { UserConfig, DeepPartial } from '../types/config';
import { ConfigLoader } from '../config/configLoader';
import { defaultConfig } from '../config/defaultConfig';

interface ConfigState {
    config: UserConfig;
    loading: boolean;
    setConfig: (config: DeepPartial<UserConfig>) => void;
    loadConfig: () => Promise<void>;
    saveConfig: (config: UserConfig) => Promise<void>;
    resetToDefault: () => void;
}

const deepMerge = <T extends Record<string, any>>(target: T, source: DeepPartial<T>): T => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            const sourceValue = source[key as keyof typeof source];
            const targetValue = target[key as keyof typeof target];

            if (isObject(sourceValue) && key in target) {
                (output as any)[key] = deepMerge(
                    targetValue as Record<string, any>,
                    sourceValue as DeepPartial<Record<string, any>>
                );
            } else {
                (output as any)[key] = sourceValue;
            }
        });
    }
    return output;
};

const isObject = (item: unknown): item is Record<string, any> => {
    return item !== null && typeof item === 'object' && !Array.isArray(item);
};

export const useConfigStore = create<ConfigState>((set, get) => ({
    config: defaultConfig,
    loading: false,

    setConfig: (newConfig) => {
        set((state) => ({
            config: {
                ...state.config,
                ...newConfig
            }
        }) as ConfigState);
    },

    loadConfig: async () => {
        set({ loading: true });
        try {
            const configLoader = ConfigLoader.getInstance();
            const loadedConfig = await configLoader.readConfig();
            const mergedConfig = deepMerge(defaultConfig, loadedConfig);
            set({ config: mergedConfig });
        } catch (error) {
            console.error('Failed to load config:', error);
            // 如果读取失败，使用默认配置并尝试写入
            set({ config: defaultConfig });
            try {
                const configLoader = ConfigLoader.getInstance();
                await configLoader.writeConfig(defaultConfig);
            } catch (writeError) {
                console.error('Failed to write default config:', writeError);
            }
        } finally {
            set({ loading: false });
        }
    },

    saveConfig: async (config) => {
        set({ loading: true });
        try {
            const configLoader = ConfigLoader.getInstance();
            await configLoader.writeConfig(config);
            set({ config });
        } catch (error) {
            console.error('Failed to save config:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    resetToDefault: () => {
        set({ config: defaultConfig });
    },
}));
