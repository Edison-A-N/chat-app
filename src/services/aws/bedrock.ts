import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { PromptResponse } from './types';
import { ConfigLoader } from '../../config';

interface Message {
    role: "user" | "assistant";
    content: string;
}

// Create a function to initialize the client
async function createBedrockClient() {
    try {
        // Ensure the config is loaded before accessing it
        await ConfigLoader.getInstance().loadConfig();

        const config = ConfigLoader.getInstance().getConfig();
        const awsConfig = config.aws;

        console.log('Creating Bedrock client with region:', awsConfig.region);
        console.log('Access key ID:', awsConfig.credentials.accessKeyId);
        console.log('Secret access key:', awsConfig.credentials.secretAccessKey);

        return new BedrockRuntimeClient({
            region: awsConfig.region,
            credentials: {
                accessKeyId: awsConfig.credentials.accessKeyId,
                secretAccessKey: awsConfig.credentials.secretAccessKey
            }
        });
    } catch (error) {
        console.error('Failed to initialize Bedrock client:', error);
        throw error;
    }
}

// Initialize the client
let client: BedrockRuntimeClient;

// Function to ensure client is initialized
async function getClient() {
    if (!client) {
        client = await createBedrockClient();
    }
    return client;
}

export const getResponseFromBedrock = async (messages: Message[]): Promise<PromptResponse> => {
    try {
        const bedrockClient = await getClient();
        const config = ConfigLoader.getInstance().getConfig();
        const bedrockConfig = config.aws.bedrock;

        const payload = {
            max_tokens: bedrockConfig.maxTokens,
            anthropic_version: bedrockConfig.anthropicVersion,
            messages: messages,
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
        const config = ConfigLoader.getInstance().getConfig();
        const bedrockConfig = config.aws.bedrock;

        const payload = {
            max_tokens: bedrockConfig.maxTokens,
            anthropic_version: bedrockConfig.anthropicVersion,
            messages: messages,
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

export class BedrockService {
    private static instance: BedrockService;

    private constructor() { }

    public static getInstance(): BedrockService {
        if (!BedrockService.instance) {
            BedrockService.instance = new BedrockService();
        }
        return BedrockService.instance;
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
