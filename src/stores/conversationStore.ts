import { create } from 'zustand';
import { Message, Conversation } from '../services/conversation';
import { mkdir, writeTextFile, readTextFile, readDir } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

interface ConversationStore {
    conversations: Conversation[];
    loading: boolean;
    initialized: boolean;
    currentChat: Conversation | null;
    init: () => Promise<void>;
    loadConversations: () => Promise<void>;
    saveConversation: (subject: string, messages: Message[], options?: {
        model?: string;
        temperature?: number;
        systemPrompt?: string;
    }) => Promise<Conversation>;
    updateConversation: (conversation: Conversation) => Promise<void>;
    getConversation: (id: string) => Conversation | undefined;
    setCurrentChat: (chat: Conversation | null) => void;
    createNewChat: (subject: string, messages: Message[]) => Promise<void>;
    updateCurrentChat: (messages: Message[]) => Promise<void>;
}

function generateId(length: number = 16): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const timestamp = Date.now().toString(36);
    let result = timestamp;

    for (let i = result.length; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
    conversations: [],
    loading: false,
    initialized: false,
    currentChat: null,

    init: async () => {
        if (get().initialized) return;

        const appData = await appDataDir();
        const conversationDir = await join(appData, 'conversations');
        await mkdir(conversationDir, { recursive: true });

        await get().loadConversations();
        set({ initialized: true });
    },

    loadConversations: async () => {
        set({ loading: true });
        try {
            const appData = await appDataDir();
            const conversationDir = await join(appData, 'conversations');
            const files = await readDir(conversationDir);

            const conversations: Conversation[] = [];
            for (const file of files) {
                if (file.name?.endsWith('.json')) {
                    const content = await readTextFile(await join(conversationDir, file.name));
                    conversations.push(JSON.parse(content));
                }
            }

            set({ conversations: conversations.sort((a, b) => b.timestamp - a.timestamp) });
        } finally {
            set({ loading: false });
        }
    },

    saveConversation: async (subject, messages, options = {}) => {
        const conversation: Conversation = {
            id: generateId(),
            subject,
            timestamp: Date.now(),
            content: {
                messages,
                ...options
            }
        };

        const appData = await appDataDir();
        const conversationDir = await join(appData, 'conversations');
        const filePath = await join(conversationDir, `${conversation.id}.json`);
        await writeTextFile(filePath, JSON.stringify(conversation, null, 2));

        set(state => ({
            conversations: [conversation, ...state.conversations]
        }));

        return conversation;
    },

    updateConversation: async (conversation) => {
        const appData = await appDataDir();
        const conversationDir = await join(appData, 'conversations');
        const filePath = await join(conversationDir, `${conversation.id}.json`);
        await writeTextFile(filePath, JSON.stringify(conversation, null, 2));

        set(state => ({
            conversations: state.conversations.map(c =>
                c.id === conversation.id ? conversation : c
            ).sort((a, b) => b.timestamp - a.timestamp)
        }));
    },

    getConversation: (id) => {
        return get().conversations.find(c => c.id === id);
    },

    setCurrentChat: (chat) => set({ currentChat: chat }),

    createNewChat: async (subject, messages) => {
        const chat = await get().saveConversation(subject, messages);
        set({ currentChat: chat });
    },

    updateCurrentChat: async (messages) => {
        const { currentChat } = get();
        if (!currentChat) return;

        const updatedChat: Conversation = {
            ...currentChat,
            timestamp: Date.now(),
            content: {
                ...currentChat.content,
                messages
            }
        };

        await get().updateConversation(updatedChat);
        set({ currentChat: updatedChat });
    },
}));
