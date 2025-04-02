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

    messageBuilder(systemMessage?: string): MessageBuilder {
        return new MessageBuilder(systemMessage);
    }

    async chat(
        messages: Message[],
        options?: {
            stream?: boolean;
            onChunk?: (chunk: string, isComplete: boolean) => void;
        }
    ): Promise<string> {
        if (!this.client) {
            this.initClient();
        }

        // If streaming is disabled in config or not requested, use non-streaming
        if (this.config?.openai?.stream === false) {
            try {
                const params: ChatCompletionCreateParams = {
                    messages: messages.map(msg => ({
                        role: msg.role as any,
                        content: msg.content
                    })),
                    model: this.config?.openai?.modelId || '',
                };

                const response = await this.client!.chat.completions.create(params);
                const content = response.choices[0]?.message?.content || '';
                options?.onChunk?.(content, true);
                return content;
            } catch (error) {
                console.error('OpenAI chat error:', error);
                throw error;
            }
        }

        // Streaming implementation
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
                    return accumulatedContent;
                }
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    accumulatedContent += content;
                    options?.onChunk?.(accumulatedContent, false);
                }
            }
            options?.onChunk?.(accumulatedContent, true);
            return accumulatedContent;
        } catch (error) {
            if ((error as any)?.name !== 'AbortError') {
                console.error('OpenAI stream chat error:', error);
                throw error;
            }
            return '';
        }
    }

    abortStreaming(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}

class MessageBuilder {
    private messages: Message[] = [];

    constructor(systemMessage?: string) {
        if (systemMessage) {
            if (typeof systemMessage === 'string') {
                this.addSystemMessage(systemMessage);
            } else {
                throw new Error('System message must be a string');
            }
        }
    }

    addSystemMessage(content: string): MessageBuilder {
        this.messages.push({
            role: 'system',
            content: content,
            timestamp: Date.now()
        });
        return this;
    }

    addUserMessage(content: string): MessageBuilder {
        this.messages.push({
            role: 'user',
            content: content,
            timestamp: Date.now()
        });
        return this;
    }

    addAssistantMessage(content: string): MessageBuilder {
        this.messages.push({
            role: 'assistant',
            content: content,
            timestamp: Date.now()
        });
        return this;
    }

    /**
     * Build the final message array
     */
    build(): Message[] {
        return [...this.messages];
    }
}
