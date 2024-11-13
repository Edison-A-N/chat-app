import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { UserConfig } from '../types/config';
import { defaultConfig } from '../config/defaultConfig';

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function deepMerge<T extends Record<string, any>>(target: T, source: DeepPartial<T>): T {
    const result: T = { ...target };

    if (!source) return result;

    Object.keys(source).forEach((key) => {
        const targetValue = target[key];
        const sourceValue = source[key as keyof typeof source];

        if (
            targetValue &&
            sourceValue &&
            typeof targetValue === 'object' &&
            typeof sourceValue === 'object' &&
            !Array.isArray(targetValue) &&
            !Array.isArray(sourceValue)
        ) {
            (result as any)[key] = deepMerge(targetValue, sourceValue as any);
        } else if (sourceValue !== undefined) {
            (result as any)[key] = sourceValue;
        }
    });

    return result;
}

export class ConfigService {
    private static async getConfigPath(): Promise<string> {
        const appDataDirPath = await appDataDir();
        return await join(appDataDirPath, 'config.json');
    }

    static async loadConfig(): Promise<UserConfig> {
        try {
            const configPath = await this.getConfigPath();
            const configStr = await readTextFile(configPath);
            const loadedConfig = JSON.parse(configStr) as DeepPartial<UserConfig>;
            const finalConfig = deepMerge(defaultConfig, loadedConfig);
            return finalConfig;
        } catch (readError) {
            try {
                await this.saveConfig(defaultConfig);
            } catch (writeError) {
                console.warn('Failed to write default config:', writeError);
            }
            return defaultConfig;
        }
    }

    static async saveConfig(config: UserConfig): Promise<void> {
        const configPath = await this.getConfigPath();
        await writeTextFile(configPath, JSON.stringify(config, null, 2));
    }
}
