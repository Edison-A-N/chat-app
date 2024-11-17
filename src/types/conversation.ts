export interface ConversationContent {
    messages: Message[];
    provider: string;
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
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
};
