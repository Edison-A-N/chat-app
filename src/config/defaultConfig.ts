import { UserConfig } from '../types/config';

export const defaultConfig: UserConfig = {
    openai: {
        apiKey: '',
        endpoint: '',
        modelId: '',
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.9,
        stopSequences: [],
        stream: true,
    },
    chat: {
        maxHistoryLength: 10,
    }
};
