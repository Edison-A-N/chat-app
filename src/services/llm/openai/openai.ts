import { OpenAI } from 'openai';
import type { ChatCompletionCreateParams } from 'openai/resources/chat/completions';
import { LLMService, Message } from '../types';
import { useConfigStore } from '../../../stores/configStore';
import { UserConfig } from '../../../types/config';

export class OpenAIService implements LLMService {
    private static instance: OpenAIService | null = null;
    private client: OpenAI | null = null;
    private abortController: AbortController | null = null;
    private unsubscribe: (() => void) | null = null;
    private config: UserConfig = useConfigStore.getState().config;

    constructor() {
        this.config = useConfigStore.getState().config;

        this.unsubscribe = useConfigStore.subscribe((state) => {
            this.config = state.config;

            try {
                this.initClient();
                console.log('OpenAI client reconfigured with new settings');
            } catch (error) {
                console.error('Failed to reconfigure OpenAI client:', error);
            }
        });
    }


    public static getInstance(): OpenAIService {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService();
        }
        return OpenAIService.instance;
    }

    private initClient() {
        if (!this.config.openai.apiKey || !this.config.openai.endpoint) {
            throw new Error('OpenAI configuration is missing');
        }

        this.client = new OpenAI({
            apiKey: this.config.openai.apiKey,
            baseURL: `${this.config.openai.endpoint}`,
            dangerouslyAllowBrowser: true
        });
    }

    public static cleanup() {
        if (OpenAIService.instance?.unsubscribe) {
            OpenAIService.instance.unsubscribe();
            OpenAIService.instance.unsubscribe = null;
        }
        OpenAIService.instance = null;
    }

    async chat(messages: Message[]): Promise<string> {
        if (!this.client) {
            this.initClient();
        }

        try {
            const params: ChatCompletionCreateParams = {
                messages: messages.map(msg => ({
                    role: msg.role as any,
                    content: msg.content
                })),
                model: this.config?.openai?.modelId || '',
            };

            const response = await this.client!.chat.completions.create(params);
            return response.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('OpenAI chat error:', error);
            throw error;
        }
    }

    async streamChat(
        messages: Message[],
        onChunk: (chunk: string, isComplete: boolean) => void
    ): Promise<void> {
        if (!this.client) {
            this.initClient();
        }

        if (this.config?.openai?.stream === false) {
            const response = await this.chat(messages);
            onChunk(response, true);
            return;
        }

        try {
            this.abortController = new AbortController();
            const params: ChatCompletionCreateParams = {
                messages: messages.map(msg => ({
                    role: msg.role as any,
                    content: msg.content
                })),
                model: this.config?.openai?.modelId || '',
                stream: true
            };

            const stream = await this.client!.chat.completions.create(params, {
                signal: this.abortController.signal
            });

            let accumulatedContent = '';

            for await (const chunk of stream) {
                if (this.abortController.signal.aborted) {
                    return;
                }
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    accumulatedContent += content;
                    onChunk(accumulatedContent, false);
                }
            }
            onChunk(accumulatedContent, true);
        } catch (error) {
            if ((error as any)?.name !== 'AbortError') {
                console.error('OpenAI stream chat error:', error);
                throw error;
            }
        }
    }

    abortStreaming(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}
