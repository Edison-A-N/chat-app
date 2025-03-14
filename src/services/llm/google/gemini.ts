import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message, LLMService } from '../types';
import { useConfigStore } from '../../../stores/configStore';

let streamController: AbortController | null = null;

export class GeminiService implements LLMService {
    private static instance: GeminiService;
    private genAI: GoogleGenerativeAI;
    private model: any;

    private constructor() {
        const configStore = useConfigStore.getState();
        const config = configStore.config;
        this.genAI = new GoogleGenerativeAI(config.google.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    public static getInstance(): GeminiService {
        if (!GeminiService.instance) {
            GeminiService.instance = new GeminiService();
        }
        return GeminiService.instance;
    }

    private convertMessages(messages: Message[]) {
        return messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        })).filter(msg => msg.role === 'user' || msg.role === 'model');
    }

    public async chat(messages: Message[]): Promise<string> {
        try {
            const chat = this.model.startChat({
                history: this.convertMessages(messages.slice(0, -1))
            });
            const result = await chat.sendMessage(messages[messages.length - 1].content);
            const response = result.response;
            return response.text();
        } catch (error) {
            console.error('Chat error:', error);
            throw new Error((error as any)?.message || 'Unknown error');
        }
    }

    public async streamChat(
        messages: Message[],
        onChunk: (chunk: string, isComplete: boolean) => void
    ): Promise<void> {
        try {
            streamController = new AbortController();
            const history = messages.slice(0, -1);
            const lastMessage = messages[messages.length - 1];

            const chat = this.model.startChat({
                history: history.length > 0 ? this.convertMessages(history) : []
            });

            const result = await chat.sendMessage(
                lastMessage.content,
                { streamingResponse: true }
            );

            let aggregatedText = '';
            for await (const chunk of result.stream) {
                if (streamController?.signal.aborted) {
                    throw new Error('Stream aborted');
                }
                const chunkText = chunk.text();
                aggregatedText += chunkText;
                onChunk(aggregatedText, false);
            }
            onChunk(aggregatedText, true);

        } catch (error) {
            if ((error as Error).message === 'Stream aborted') {
                console.log('Stream was aborted');
                return;
            }
            console.error('Stream chat error:', error);
            throw new Error((error as any)?.message || 'Unknown error');
        } finally {
            streamController = null;
        }
    }

    public abortStreaming(): void {
        if (streamController) {
            streamController.abort();
        }
    }
}
