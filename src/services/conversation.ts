import { mkdir, writeTextFile, readTextFile, readDir } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';
import { join } from '@tauri-apps/api/path';

// 生成随机ID的辅助函数
function generateId(length: number = 16): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const timestamp = Date.now().toString(36);
    let result = timestamp;

    for (let i = result.length; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface Conversation {
    id: string;
    subject: string;
    timestamp: number;
    content: {
        messages: Message[];
        model?: string;
        temperature?: number;
        systemPrompt?: string;
    };
}

export class ConversationService {
    private conversationDir: string | null = null;
    private conversations: Conversation[] = [];
    private initialized = false;

    async init() {
        if (this.initialized) return;

        const appData = await appDataDir();
        this.conversationDir = await join(appData, 'conversations');

        try {
            await mkdir(this.conversationDir, { recursive: true });
            await this.loadAllConversations();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize conversation service:', error);
            throw error;
        }
    }

    private async loadAllConversations() {
        if (!this.conversationDir) return;

        const files = await readDir(this.conversationDir);
        const conversations: Conversation[] = [];

        for (const file of files) {
            if (file.name?.endsWith('.json')) {
                const content = await readTextFile(await join(this.conversationDir, file.name));
                conversations.push(JSON.parse(content));
            }
        }

        this.conversations = conversations.sort((a, b) => b.timestamp - a.timestamp);
    }

    async saveConversation(subject: string, messages: Message[], options: {
        model?: string;
        temperature?: number;
        systemPrompt?: string;
    } = {}) {
        if (!this.conversationDir) {
            throw new Error('Conversation service not initialized');
        }

        const conversation: Conversation = {
            id: generateId(),
            subject,
            timestamp: Date.now(),
            content: {
                messages,
                ...options
            }
        };

        const filePath = await join(this.conversationDir, `${conversation.id}.json`);
        await writeTextFile(filePath, JSON.stringify(conversation, null, 2));

        this.conversations.unshift(conversation);
        return conversation;
    }

    async loadConversation(id: string): Promise<Conversation> {
        const conversation = this.conversations.find(c => c.id === id);
        if (conversation) return conversation;

        if (!this.conversationDir) {
            throw new Error('Conversation service not initialized');
        }

        const filePath = await join(this.conversationDir, `${id}.json`);
        const content = await readTextFile(filePath);
        return JSON.parse(content);
    }

    async listConversations(): Promise<Conversation[]> {
        if (!this.initialized) {
            await this.init();
        }
        return this.conversations;
    }

    async updateConversation(conversation: Conversation) {
        if (!this.conversationDir) {
            throw new Error('Conversation service not initialized');
        }

        const filePath = await join(this.conversationDir, `${conversation.id}.json`);
        await writeTextFile(filePath, JSON.stringify(conversation, null, 2));

        const index = this.conversations.findIndex(c => c.id === conversation.id);
        if (index !== -1) {
            this.conversations[index] = conversation;
            this.conversations.sort((a, b) => b.timestamp - a.timestamp);
        }

        return conversation;
    }
}

export const conversationService = new ConversationService();
