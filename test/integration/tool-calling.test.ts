import { describe, it, expect } from 'vitest';
import { generateText, tool, jsonSchema, stepCountIs } from 'ai';
import { createTelnyx } from '../../src/telnyx-provider';
import { API_KEY } from '../utils';

describe.skipIf(!API_KEY)('Tool Calling Integration', () => {
  const telnyx = createTelnyx({ apiKey: API_KEY });

  it('calls a tool and returns result', async () => {
    const { text, steps } = await generateText({
      model: telnyx('Qwen/Qwen3-235B-A22B'),
      prompt: 'What is the weather in Santiago, Chile?',
      tools: {
        weather: tool({
          description: 'Get the weather for a location',
          inputSchema: jsonSchema({
            type: 'object',
            properties: {
              location: { type: 'string', description: 'The location to get weather for' },
            },
            required: ['location'],
          }),
          execute: async ({ location }) => {
            return `22°C, sunny in ${location}`;
          },
        }),
      },
      stopWhen: stepCountIs(5),
    });

    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
    // Should have at least one tool call step
    expect(steps.length).toBeGreaterThanOrEqual(1);
  }, 30000);
});
