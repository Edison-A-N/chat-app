import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { UserConfig } from '../types/config';

export class ConfigLoader {
    private static readonly CONFIG_FILE = 'config.json';
    private static instance: ConfigLoader;
    private configPath: string = '';

    private constructor() { }

    public static getInstance(): ConfigLoader {
        if (!ConfigLoader.instance) {
            ConfigLoader.instance = new ConfigLoader();
        }
        return ConfigLoader.instance;
    }

    private async getConfigPath(): Promise<string> {
        if (!this.configPath) {
            const appDataDirPath = await appDataDir();
            this.configPath = await join(appDataDirPath, ConfigLoader.CONFIG_FILE);
        }
        return this.configPath;
    }

    public async readConfig(): Promise<UserConfig> {
        try {
            const configPath = await this.getConfigPath();
            const configStr = await readTextFile(configPath);
            return JSON.parse(configStr);
        } catch (error) {
            console.error('Failed to read config file:', error);
            throw error;
        }
    }

    public async writeConfig(config: UserConfig): Promise<void> {
        try {
            const configPath = await this.getConfigPath();
            await writeTextFile(
                configPath,
                JSON.stringify(config, null, 2)
            );
        } catch (error) {
            console.error('Failed to write config file:', error);
            throw error;
        }
    }
}
