export interface Conversation {
    id: string;
    subject: string;
    timestamp: number;
    content: {
        messages: Array<{
            role: 'user' | 'assistant';
            content: string;
            timestamp: number;
        }>;
    };
}

export type Message = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
};
