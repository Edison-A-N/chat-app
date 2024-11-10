export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface PromptResponse {
    completion: string;
}

export interface LLMService {
    chat(messages: Message[]): Promise<string>;
    streamChat(messages: Message[], onChunk: (chunk: string, isComplete: boolean) => void): Promise<void>;
    abortStreaming(): void;
}

export interface LLMServiceFactory {
    createService(type: 'bedrock' | 'gemini'): LLMService;
}
