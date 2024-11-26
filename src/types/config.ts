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
            endpoint?: string;
        };
    };
    google: {
        apiKey: string;
    };
    chat: {
        maxHistoryLength: number;
    };
    llm: {
        provider: LLMProvider;
    };
    azure?: {
        apiKey: string;
        endpoint: string;
        model: string;
    };
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type LLMProvider = "bedrock" | "gemini" | "azure";

export interface LLMConfig {
    provider: LLMProvider;
    // ... other config properties
}
