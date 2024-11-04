export const CONFIG = {
    AWS: {
        REGION: "us-east-1",
    },

    AI: {
        BEDROCK: {
            MODEL_ID: "anthropic.claude-3-sonnet-20240229-v1:0",
            MAX_TOKENS: 1000,
            ANTHROPIC_VERSION: "bedrock-2023-05-31",
        }
    },

} as const;
