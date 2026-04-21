# @telnyx/ai-sdk-provider

Telnyx provider for the [Vercel AI SDK](https://ai-sdk.dev) — LLM, Embeddings, TTS, and STT in a single package.

## Why Telnyx?

**No other AI SDK provider covers all four interfaces:**

| Provider | LLM | Embeddings | TTS | STT |
|---|:---:|:---:|:---:|:---:|
| OpenAI | ✅ | ✅ | ❌ | ❌ |
| Anthropic | ✅ | ❌ | ❌ | ❌ |
| Fireworks | ✅ | ✅ | ❌ | ❌ |
| ElevenLabs | ❌ | ❌ | ✅ | ✅ |
| Deepgram | ❌ | ❌ | ✅ | ✅ |
| **Telnyx** | **✅** | **✅** | **✅** | **✅** |

A developer building a voice AI app currently needs 2–3 providers. With Telnyx, just one.

## Setup

```bash
npm install @telnyx/ai-sdk-provider ai
```

Set your Telnyx API key:

```bash
export TELNYX_API_KEY="your_api_key_here"
```

## Usage

### Chat (LLM)

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: telnyx('Qwen/Qwen3-235B-A22B'),
  prompt: 'Explain WebRTC in simple terms',
});
```

### Streaming

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { streamText } from 'ai';

const result = streamText({
  model: telnyx('moonshotai/Kimi-K2.5'),
  prompt: 'Write a poem about the cloud',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Embeddings

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { embed } from 'ai';

const { embedding } = await embed({
  model: telnyx.embeddingModel('thenlper/gte-large'),
  value: 'What is WebRTC?',
});
```

### Function Calling

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const { text } = await generateText({
  model: telnyx('Qwen/Qwen3-235B-A22B'),
  prompt: 'Send an SMS to +1234567890 saying Hello',
  tools: {
    sendSMS: tool({
      description: 'Send an SMS message',
      parameters: z.object({
        to: z.string(),
        message: z.string(),
      }),
      execute: async ({ to, message }) => {
        // Your SMS logic here
        return { success: true };
      },
    }),
  },
});
```

### Custom Instance

```typescript
import { createTelnyx } from '@telnyx/ai-sdk-provider';

const telnyx = createTelnyx({
  apiKey: 'KEY_ID_SECRET',
  baseURL: 'https://api.telnyx.com/v2/ai/openai', // optional override
});
```

## Available Models

### Chat Models

| Model ID | Best For |
|---|---|
| `moonshotai/Kimi-K2.5` | General use, voice AI |
| `zai-org/GLM-5.1-FP8` | Highest intelligence open-source |
| `MiniMaxAI/MiniMax-M2.7` | Cost-effective, high intelligence |
| `Qwen/Qwen3-235B-A22B` | Function calling, reasoning |

### Embedding Models

| Model ID | Dimensions |
|---|---|
| `thenlper/gte-large` | 1024 |

### TTS & STT

Coming soon — Phase 3 implementation.

## License

MIT
