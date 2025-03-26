export interface UserConfig {
    openai: {
        apiKey: string;
        endpoint: string;
        modelId: string;
        maxTokens: number;
        temperature: number;
        topP: number;
        stopSequences: string[];
        stream: boolean;
    };
    chat: {
        maxHistoryLength: number;
    };
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
