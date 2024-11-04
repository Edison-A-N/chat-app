import { getResponseFromBedrock, getStreamingResponseFromBedrock } from './bedrock';

describe('Bedrock API Tests', () => {
    describe('getResponseFromBedrock', () => {
        it('should return a valid response', async () => {
            const prompt = "Hello, how are you?";
            const response = await getResponseFromBedrock(prompt);

            expect(response).toHaveProperty('completion');
            expect(typeof response.completion).toBe('string');
            expect(response.completion.length).toBeGreaterThan(0);
        });
    });

    describe('getStreamingResponseFromBedrock', () => {
        it('should stream response chunks', async () => {
            const prompt = "Hello, how are you?";
            const chunks: string[] = [];

            await getStreamingResponseFromBedrock(prompt, (chunk) => {
                chunks.push(chunk);
            });

            // 验证是否收到了流式响应
            expect(chunks.length).toBeGreaterThan(0);

            // 验证所有chunk都是字符串
            chunks.forEach(chunk => {
                expect(typeof chunk).toBe('string');
                expect(chunk.length).toBeGreaterThan(0);
            });

            // 将所有chunk组合在一起应该形成一个完整的响应
            const fullResponse = chunks.join('');
            expect(fullResponse.length).toBeGreaterThan(0);
        });

        it('should handle errors gracefully', async () => {
            const invalidPrompt = ""; // 空提示应该触发错误

            await expect(
                getStreamingResponseFromBedrock(invalidPrompt, () => {})
            ).rejects.toThrow();
        });
    });
});
