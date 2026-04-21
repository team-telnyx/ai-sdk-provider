import { describe, it, expect, beforeAll } from 'vitest';
import { generateText } from 'ai';
import { createTelnyx } from '../../src/telnyx-provider';
import { API_KEY, skipIfNoApiKey } from '../utils';

describe.skipIf(!API_KEY)('Chat Integration', () => {
  const telnyx = createTelnyx({ apiKey: API_KEY });

  it('generates text with a simple prompt', async () => {
    const { text } = await generateText({
      model: telnyx('Qwen/Qwen3-235B-A22B'),
      prompt: 'Say "hello" and nothing else.',
    });

    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
  }, 30000);

  it('generates text with system + user messages', async () => {
    const { text } = await generateText({
      model: telnyx('Qwen/Qwen3-235B-A22B'),
      system: 'You are a helpful assistant. Respond in exactly one word.',
      prompt: 'What color is the sky?',
    });

    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
  }, 30000);

  it('handles multi-turn conversation', async () => {
    const { text } = await generateText({
      model: telnyx('Qwen/Qwen3-235B-A22B'),
      messages: [
        { role: 'user', content: 'My name is TestUser.' },
        { role: 'assistant', content: 'Hello TestUser!' },
        { role: 'user', content: 'What is my name? Reply in one word.' },
      ],
    });

    expect(text).toBeDefined();
    expect(text.toLowerCase()).toContain('testuser');
  }, 30000);
});
