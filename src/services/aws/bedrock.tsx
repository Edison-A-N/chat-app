import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { PromptResponse } from './types';
import { invoke } from '@tauri-apps/api/core';
import { CONFIG } from '../../config/config';

// Create a function to initialize the client
async function createBedrockClient() {
    try {
        const [accessKeyId, secretAccessKey] = await invoke<[string, string]>('get_aws_credentials');

        return new BedrockRuntimeClient({
            region: CONFIG.AWS.REGION,
            credentials: {
                accessKeyId,
                secretAccessKey,
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

export const getResponseFromBedrock = async (prompt: string): Promise<PromptResponse> => {
    try {
        const bedrockClient = await getClient();

        const payload = {
            max_tokens: CONFIG.AI.BEDROCK.MAX_TOKENS,
            anthropic_version: CONFIG.AI.BEDROCK.ANTHROPIC_VERSION,
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        };

        const command = new InvokeModelCommand({
            modelId: CONFIG.AI.BEDROCK.MODEL_ID,
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

export const getStreamingResponseFromBedrock = async (
    prompt: string,
    onChunk: (chunk: string, isComplete: boolean) => void
): Promise<void> => {
    try {
        const bedrockClient = await getClient();

        const payload = {
            max_tokens: CONFIG.AI.BEDROCK.MAX_TOKENS,
            anthropic_version: CONFIG.AI.BEDROCK.ANTHROPIC_VERSION,
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ]
        };

        const command = new InvokeModelWithResponseStreamCommand({
            modelId: CONFIG.AI.BEDROCK.MODEL_ID,
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
        console.error('Error:', error);
        throw error;
    }
};
