import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand, BedrockRuntimeClientConfig } from "@aws-sdk/client-bedrock-runtime";
import { PromptResponse, LLMService, Message } from '../types';
import { useConfigStore } from '../../../stores/configStore';

// 在文件开头添加
let configInitialized = false;

// 添加配置订阅
let unsubscribe: (() => void) | null = null;

// 在文件开头添加消息转换函数
function convertMessagesToBedrockFormat(messages: Message[]) {
    return messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
    }));
}

// Create a function to initialize the client
async function createBedrockClient() {
    const state = useConfigStore.getState();

    const awsConfig = state.config.aws;
    if (!awsConfig?.credentials?.accessKeyId || !awsConfig?.credentials?.secretAccessKey) {
        throw new Error('AWS credentials not found in config. Please check your configuration.');
    }

    const clientConfig: BedrockRuntimeClientConfig = {
        region: awsConfig.region,
        credentials: {
            accessKeyId: awsConfig.credentials.accessKeyId,
            secretAccessKey: awsConfig.credentials.secretAccessKey
        }
    };

    // Add endpoint if configured
    if (awsConfig.bedrock?.endpoint) {
        clientConfig.endpoint = awsConfig.bedrock.endpoint;
    }

    return new BedrockRuntimeClient(clientConfig);
}

// Initialize the client
let client: BedrockRuntimeClient | null = null;

// Function to ensure client is initialized
async function getClient() {
    if (!configInitialized) {
        const state = useConfigStore.getState();

        // 如果配置正在加载，等待加载完成
        if (state.loading) {
            await new Promise<void>((resolve) => {
                const unsubscribe = useConfigStore.subscribe((state) => {
                    if (!state.loading) {
                        unsubscribe();
                        resolve();
                    }
                });
            });
        }
        configInitialized = true;
    }

    if (!client) {
        try {
            client = await createBedrockClient();

            // 更新配置订阅逻辑
            if (!unsubscribe) {
                unsubscribe = useConfigStore.subscribe((state, prevState) => {
                    // 检查 AWS 配置的具体字段变化
                    const prevAws = prevState.config.aws;
                    const currentAws = state.config.aws;

                    if (
                        prevAws?.credentials?.accessKeyId !== currentAws?.credentials?.accessKeyId ||
                        prevAws?.credentials?.secretAccessKey !== currentAws?.credentials?.secretAccessKey ||
                        prevAws?.region !== currentAws?.region
                    ) {
                        client = null;
                    }
                });
            }
        } catch (error) {
            console.error('Failed to create Bedrock client:', error);
            throw error;
        }
    }
    return client;
}

export const getResponseFromBedrock = async (messages: Message[]): Promise<PromptResponse> => {
    try {
        const bedrockClient = await getClient();
        const config = useConfigStore.getState().config;
        const bedrockConfig = config.aws.bedrock;

        const payload = {
            max_tokens: bedrockConfig.maxTokens,
            anthropic_version: bedrockConfig.anthropicVersion,
            messages: convertMessagesToBedrockFormat(messages),
        };

        const command = new InvokeModelCommand({
            modelId: bedrockConfig.modelId,
            body: JSON.stringify(payload),
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        if (!responseBody.content) {
            throw new Error('Completion not found in response');
        }

        return {
            completion: responseBody.content[0].text,
        };
    } catch (error) {
        console.error('Error:', error);
        if (error instanceof Error) {
            if (error.message.includes('credentials')) {
                console.error('Failed to load AWS credentials. Please check your credentials configuration');
            }
        }
        throw error;
    }
};

let streamController: AbortController | null = null;

export const getStreamingResponseFromBedrock = async (
    messages: Message[],
    onChunk: (chunk: string, isComplete: boolean) => void
): Promise<void> => {
    try {
        streamController = new AbortController();
        const bedrockClient = await getClient();
        const config = useConfigStore.getState().config;
        const bedrockConfig = config.aws.bedrock;

        const payload = {
            max_tokens: bedrockConfig.maxTokens,
            anthropic_version: bedrockConfig.anthropicVersion,
            messages: convertMessagesToBedrockFormat(messages),
        };

        const command = new InvokeModelWithResponseStreamCommand({
            modelId: bedrockConfig.modelId,
            body: JSON.stringify(payload),
            contentType: "application/json",
            accept: "application/json",
        });

        const response = await bedrockClient.send(command);

        let aggregatedText = '';

        if (!response.body) {
            throw new Error('No response body received');
        }

        for await (const chunk of response.body) {
            if (streamController?.signal.aborted) {
                throw new Error('Stream aborted');
            }
            if (!chunk.chunk?.bytes) {
                continue;
            }

            const decoded = new TextDecoder().decode(chunk.chunk.bytes);
            try {
                const parsed = JSON.parse(decoded);
                if (parsed.delta?.type === 'text_delta' && parsed.delta?.text) {
                    aggregatedText += parsed.delta.text;
                    onChunk(aggregatedText, false);
                } else if (parsed.type === 'content_block_stop') {
                    onChunk(aggregatedText, true);
                }
            } catch (e) {
                console.error('Error parsing chunk:', e);
            }
        }

    } catch (error) {
        if ((error as Error).message === 'Stream aborted') {
            console.log('Stream was aborted');
            return;
        }
        console.error('Error:', error);
        throw error;
    } finally {
        streamController = null;
    }
};

export const abortStreamingResponse = () => {
    if (streamController) {
        streamController.abort();
    }
};

export class BedrockService implements LLMService {
    private static instance: BedrockService;

    private constructor() { }

    public static getInstance(): BedrockService {
        if (!BedrockService.instance) {
            BedrockService.instance = new BedrockService();
        }
        return BedrockService.instance;
    }

    // 添加清理方法
    public static cleanup() {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
        client = null;
        configInitialized = false;  // 重置初始化标志
    }

    public async chat(messages: Message[]): Promise<string> {
        try {
            const response = await getResponseFromBedrock(messages);
            return response.completion;
        } catch (error) {
            console.error('Chat error:', error);
            throw error;
        }
    }

    public async streamChat(
        messages: Message[],
        onChunk: (chunk: string, isComplete: boolean) => void
    ): Promise<void> {
        try {
            await getStreamingResponseFromBedrock(messages, onChunk);
        } catch (error) {
            console.error('Stream chat error:', error);
            throw error;
        }
    }

    public abortStreaming(): void {
        abortStreamingResponse();
    }
}
