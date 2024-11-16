import { create } from 'zustand';
import { conversationService, type Message, type Conversation } from '../services/conversation';

interface ChatState {
    currentChat: Conversation | null;
    setCurrentChat: (chat: Conversation | null) => void;
    createNewChat: (subject: string, messages: Message[]) => Promise<void>;
    updateCurrentChat: (messages: Message[]) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
    currentChat: null,

    setCurrentChat: (chat) => set({ currentChat: chat }),

    createNewChat: async (subject, messages) => {
        const chat = await conversationService.saveConversation(subject, messages);
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

        await conversationService.updateConversation(updatedChat);
        set({ currentChat: updatedChat });
    },
}));
