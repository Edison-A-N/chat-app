export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface PromptResponse {
    completion: string;
}

export interface MessageBuilder {
    addUserMessage(content: string): MessageBuilder;
    addAssistantMessage(content: string): MessageBuilder;
    addSystemMessage(content: string): MessageBuilder;
    build(): Message[];
}

export interface LLMService {
    chat(messages: Message[]): Promise<string>;
    streamChat(messages: Message[], onChunk: (chunk: string, isComplete: boolean) => void): Promise<void>;
    abortStreaming(): void;
    messageBuilder(systemMessage?: string): MessageBuilder;
}

export interface LLMServiceFactory {
    createService(type: 'bedrock' | 'gemini'): LLMService;
}
