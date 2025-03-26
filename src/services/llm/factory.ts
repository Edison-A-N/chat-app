import { LLMService, LLMServiceFactory } from './types';
import { OpenAIService } from './openai/openai';
export class LLMServiceFactoryImpl implements LLMServiceFactory {
    private static instance: LLMServiceFactoryImpl;

    private constructor() { }

    public static getInstance(): LLMServiceFactoryImpl {
        if (!LLMServiceFactoryImpl.instance) {
            LLMServiceFactoryImpl.instance = new LLMServiceFactoryImpl();
        }
        return LLMServiceFactoryImpl.instance;
    }

    public createService(): LLMService {
        return OpenAIService.getInstance();
    }
}
