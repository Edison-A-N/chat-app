import { LLMService, LLMServiceFactory } from './types';
import { BedrockService } from './aws/bedrock';
import { GeminiService } from './google/gemini';

export class LLMServiceFactoryImpl implements LLMServiceFactory {
    private static instance: LLMServiceFactoryImpl;

    private constructor() { }

    public static getInstance(): LLMServiceFactoryImpl {
        if (!LLMServiceFactoryImpl.instance) {
            LLMServiceFactoryImpl.instance = new LLMServiceFactoryImpl();
        }
        return LLMServiceFactoryImpl.instance;
    }

    public createService(type: 'bedrock' | 'gemini'): LLMService {
        switch (type) {
            case 'bedrock':
                return BedrockService.getInstance();
            case 'gemini':
                return GeminiService.getInstance();
            default:
                throw new Error(`Unsupported LLM service type: ${type}`);
        }
    }
}
