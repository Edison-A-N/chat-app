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
    google: {
        apiKey: string;
    };
    chat: {
        maxHistoryLength: number;
    };
    llm: {
        provider: 'bedrock' | 'gemini';
    };
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
