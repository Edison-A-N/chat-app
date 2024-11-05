export interface UserConfig {
    aws: {
        region: string;
        credentials: {
            accessKeyId: string;
            secretAccessKey: string;
        };
        bedrock: {
            modelId: string;
            maxTokens: number;
            temperature: number;
            topP: number;
            stopSequences: string[];
            anthropicVersion: string;
        };
    };
    chat: {
        maxHistoryLength: number;
    };
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
