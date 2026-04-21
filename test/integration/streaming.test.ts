import { describe, it, expect } from 'vitest';
import { streamText } from 'ai';
import { createTelnyx } from '../../src/telnyx-provider';
import { API_KEY } from '../utils';

describe.skipIf(!API_KEY)('Streaming Integration', () => {
  const telnyx = createTelnyx({ apiKey: API_KEY });

  it('streams text tokens', async () => {
    const result = streamText({
      model: telnyx('Qwen/Qwen3-235B-A22B'),
      prompt: 'Count from 1 to 5.',
    });

    const chunks: string[] = [];
    for await (const chunk of result.textStream) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);

    const fullText = chunks.join('');
    expect(fullText.length).toBeGreaterThan(0);
  }, 30000);

  it('provides usage info after streaming', async () => {
    const result = streamText({
      model: telnyx('Qwen/Qwen3-235B-A22B'),
      prompt: 'Say hello.',
    });

    // Consume the stream
    const chunks: string[] = [];
    for await (const chunk of result.textStream) {
      chunks.push(chunk);
    }

    const usage = await result.usage;
    expect(usage).toBeDefined();
    expect(usage?.inputTokens).toBeGreaterThan(0);
    expect(usage?.outputTokens).toBeGreaterThan(0);
  }, 30000);
});
