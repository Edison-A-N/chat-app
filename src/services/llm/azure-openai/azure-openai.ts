import { OpenAI } from 'openai';
import type { ChatCompletionCreateParams } from 'openai/resources/chat/completions';
import { LLMService, Message } from '../types';
import { useConfigStore } from '../../../stores/configStore';
import { UserConfig } from '../../../types/config';

export class AzureOpenAIService implements LLMService {
    private static instance: AzureOpenAIService | null = null;
    private client: OpenAI | null = null;
    private abortController: AbortController | null = null;
    private unsubscribe: (() => void) | null = null;
    private config: UserConfig = useConfigStore.getState().config;

    private constructor() {
        this.unsubscribe = useConfigStore.subscribe((state, prevState) => {
            if (state.config.azure !== prevState.config.azure) {
                this.client = null;
            }
        });
    }

    public static getInstance(): AzureOpenAIService {
        if (!AzureOpenAIService.instance) {
            AzureOpenAIService.instance = new AzureOpenAIService();
        }
        return AzureOpenAIService.instance;
    }

    private initClient() {
        if (!this.config?.azure?.apiKey || !this.config.azure.endpoint) {
            throw new Error('Azure OpenAI configuration is missing');
        }

        this.client = new OpenAI({
            apiKey: this.config.azure.apiKey,
            baseURL: `${this.config.azure.endpoint}`,
            dangerouslyAllowBrowser: true
        });
    }

    public static cleanup() {
        if (AzureOpenAIService.instance?.unsubscribe) {
            AzureOpenAIService.instance.unsubscribe();
            AzureOpenAIService.instance.unsubscribe = null;
        }
        AzureOpenAIService.instance = null;
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
                model: this.config?.azure?.model || '',
            };

            const response = await this.client!.chat.completions.create(params);
            return response.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('Azure OpenAI chat error:', error);
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

        if (this.config?.azure?.stream === false) {
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
                model: this.config?.azure?.model || '',
                stream: true
            };

            const stream = await this.client!.chat.completions.create(params, {
                signal: this.abortController.signal
            });

            for await (const chunk of stream) {
                if (this.abortController.signal.aborted) {
                    return;
                }
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    onChunk(content, false);
                }
            }
            onChunk('', true);
        } catch (error) {
            if ((error as any)?.name !== 'AbortError') {
                console.error('Azure OpenAI stream chat error:', error);
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
