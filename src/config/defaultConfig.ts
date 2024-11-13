import { UserConfig } from '../types/config';

export const defaultConfig: UserConfig = {
    aws: {
        credentials: {
            accessKeyId: '',
            secretAccessKey: ''
        },
        region: 'us-east-1',
        bedrock: {
            modelId: 'anthropic.claude-v2',
            maxTokens: 4096,
            temperature: 0.7,
            topP: 0.9,
            stopSequences: [],
            anthropicVersion: 'bedrock-2023-05-31'
        }
    },
    google: {
        apiKey: ''
    },
    llm: {
        provider: 'bedrock'
    },
    chat: {
        maxHistoryLength: 10,
    }
};
