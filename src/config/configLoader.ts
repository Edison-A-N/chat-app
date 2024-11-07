import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { UserConfig, DeepPartial } from '../types/config';
import { defaultConfig } from './defaultConfig';

export class ConfigLoader {
    private static readonly CONFIG_FILE = 'config.json';
    private static instance: ConfigLoader;
    private userConfig: UserConfig = defaultConfig;
    private configPath: string = '';

    private constructor() { }

    public static getInstance(): ConfigLoader {
        if (!ConfigLoader.instance) {
            ConfigLoader.instance = new ConfigLoader();
        }
        return ConfigLoader.instance;
    }

    public async loadConfig(): Promise<void> {
        try {
            // Get the full path to the config file
            this.configPath = await this.getConfigPath();
            console.log('Config path:', this.configPath);

            const configStr = await readTextFile(this.configPath);
            const loadedConfig = JSON.parse(configStr) as DeepPartial<UserConfig>;
            console.log('Loaded config:', loadedConfig);
            this.userConfig = this.deepMerge(defaultConfig, loadedConfig);
            console.log('Merged config:', this.userConfig);
        } catch (error) {
            console.error('Failed to load config:', error);
            await this.initializeConfig();
        }
    }

    private async getConfigPath(): Promise<string> {
        const appDataDirPath = await appDataDir();
        return await join(appDataDirPath, ConfigLoader.CONFIG_FILE);
    }

    private async initializeConfig(): Promise<void> {
        try {
            this.configPath = await this.getConfigPath();

            await writeTextFile(
                this.configPath,
                JSON.stringify(defaultConfig, null, 2)
            );
            this.userConfig = defaultConfig;
        } catch (error) {
            console.error('Failed to initialize config:', error);
            throw error;
        }
    }

    public async saveConfig(config: DeepPartial<UserConfig>): Promise<void> {
        try {
            this.userConfig = this.deepMerge(this.userConfig, config);
            await writeTextFile(
                this.configPath,
                JSON.stringify(this.userConfig, null, 2)
            );
        } catch (error) {
            console.error('Failed to save config:', error);
            throw error;
        }
    }

    public getConfig(): UserConfig {
        console.log('Getting config:', this.userConfig);
        return this.userConfig;
    }

    public async updateConfig(newConfig: DeepPartial<UserConfig>): Promise<void> {
        await this.saveConfig(newConfig);
    }

    private deepMerge<T extends Record<string, any>>(target: T, source: DeepPartial<T>): T {
        const output = { ...target };
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                const sourceValue = source[key as keyof typeof source];
                const targetValue = target[key as keyof typeof target];

                if (isObject(sourceValue)) {
                    if (!(key in target)) {
                        (output as any)[key] = sourceValue;
                    } else {
                        (output as any)[key] = this.deepMerge(
                            targetValue as Record<string, any>,
                            sourceValue as DeepPartial<Record<string, any>>
                        );
                    }
                } else {
                    (output as any)[key] = sourceValue;
                }
            });
        }
        return output;
    }
}

function isObject(item: unknown): item is Record<string, any> {
    return item !== null && typeof item === 'object' && !Array.isArray(item);
}
