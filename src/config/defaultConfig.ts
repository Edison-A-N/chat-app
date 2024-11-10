import { UserConfig } from '../config';

export const defaultConfig: UserConfig = {
    aws: {
        region: 'us-east-1',
        credentials: {
            accessKeyId: '',
            secretAccessKey: ''
        },
        bedrock: {
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
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
