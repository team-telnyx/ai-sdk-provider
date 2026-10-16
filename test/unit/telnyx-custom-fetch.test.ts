import { generateText, streamText } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { createTelnyx } from '../../src/telnyx-provider';

// Port 1 is blocked by fetch: a forwarding regression cannot reach a live API.
const baseURL = 'http://127.0.0.1:1/v2/ai/openai';
const modelId = 'Qwen/Qwen3-235B-A22B';
const apiKey = 'synthetic-compute-1411-key';

describe('custom chat fetch', () => {
  it('uses the supplied fetch for generation with request options intact', async () => {
    const controller = new AbortController();
    const customFetch = vi.fn<typeof fetch>(async () =>
      Response.json({
        id: 'chatcmpl-test',
        object: 'chat.completion',
        created: 0,
        model: modelId,
        choices: [{
          index: 0,
          message: { role: 'assistant', content: 'Custom fetch generation' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
      }),
    );
    const provider = createTelnyx({ apiKey, baseURL, fetch: customFetch });

    const result = await generateText({
      model: provider(modelId),
      prompt: 'Hello',
      headers: { 'x-compute-1411': 'generation' },
      abortSignal: controller.signal,
      maxRetries: 0,
    });

    expect(result.text).toBe('Custom fetch generation');
    expect(result.finishReason).toBe('stop');
    expect(customFetch).toHaveBeenCalledTimes(1);
    const [url, init] = customFetch.mock.calls[0];
    expect(url).toBe(`${baseURL}/chat/completions`);
    expect(init?.method).toBe('POST');
    const headers = new Headers(init?.headers);
    expect(headers.get('authorization')).toBe(`Bearer ${apiKey}`);
    expect(headers.get('x-compute-1411')).toBe('generation');
    expect(init?.signal).toBe(controller.signal);
    expect(JSON.parse(init?.body as string)).toMatchObject({
      model: modelId,
      messages: [{ role: 'user', content: 'Hello' }],
    });
  });

  it('uses the supplied fetch for streaming and parses SSE text', async () => {
    const controller = new AbortController();
    const chunks = ['Custom ', 'fetch stream'];
    const events = [
      ...chunks.map((content) => ({
        id: 'chatcmpl-stream-test',
        object: 'chat.completion.chunk',
        created: 0,
        model: modelId,
        choices: [{ index: 0, delta: { content }, finish_reason: null }],
      })),
      {
        id: 'chatcmpl-stream-test',
        object: 'chat.completion.chunk',
        created: 0,
        model: modelId,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      },
    ];
    const sse = events.map((event) => `data: ${JSON.stringify(event)}\n\n`)
      .join('') + 'data: [DONE]\n\n';
    const customFetch = vi.fn<typeof fetch>(async () =>
      new Response(sse, { headers: { 'content-type': 'text/event-stream' } }),
    );
    const provider = createTelnyx({ apiKey, baseURL, fetch: customFetch });

    const result = streamText({
      model: provider.languageModel(modelId),
      prompt: 'Hello',
      headers: { 'x-compute-1411': 'streaming' },
      abortSignal: controller.signal,
      maxRetries: 0,
    });
    const received: string[] = [];
    for await (const chunk of result.textStream) {
      received.push(chunk);
    }

    expect(received).toEqual(chunks);
    expect(await result.text).toBe('Custom fetch stream');
    expect(await result.finishReason).toBe('stop');
    expect(customFetch).toHaveBeenCalledTimes(1);
    const [url, init] = customFetch.mock.calls[0];
    expect(url).toBe(`${baseURL}/chat/completions`);
    expect(init?.method).toBe('POST');
    const headers = new Headers(init?.headers);
    expect(headers.get('authorization')).toBe(`Bearer ${apiKey}`);
    expect(headers.get('x-compute-1411')).toBe('streaming');
    expect(init?.signal).toBe(controller.signal);
    expect(JSON.parse(init?.body as string)).toMatchObject({
      model: modelId,
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true,
    });
  });
});
