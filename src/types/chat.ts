export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    error?: boolean;
}

export interface Conversation {
    id: string;
    subject: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}
