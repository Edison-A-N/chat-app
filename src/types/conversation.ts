export interface ConversationContent {
    messages: Message[];
    model?: string;
    temperature?: number;
    systemPrompt?: string;
}

export interface Conversation {
    id: string;
    subject: string;
    timestamp: number;
    content: ConversationContent;
}

export type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
};
