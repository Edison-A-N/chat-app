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
