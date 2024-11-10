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
    llm: {
        provider: 'bedrock' | 'gemini';
    };
    chat: {
        maxHistoryLength: number;
    };
}
