# @telnyx/ai-sdk-provider

Telnyx provider for the [Vercel AI SDK](https://ai-sdk.dev) — LLM, Embeddings, and TTS in a single package.

## Why Telnyx?

**No other AI SDK provider covers all three interfaces:**

| Provider | LLM | Embeddings | TTS | STT |
|---|:---:|:---:|:---:|:---:|
| OpenAI | ✅ | ✅ | ✅ | ✅ |
| Anthropic | ✅ | ❌ | ❌ | ❌ |
| Fireworks | ✅ | ✅ | ❌ | ❌ |
| ElevenLabs | ❌ | ❌ | ✅ | ✅ |
| Deepgram | ❌ | ❌ | ✅ | ✅ |
| **Telnyx** | **✅** | **✅** | **✅** | 🔜 |

A developer building a voice AI app currently needs 2–3 providers. With Telnyx, just one.

## Setup

```bash
npm install @telnyx/ai-sdk-provider zod
```

> **Note:** This package follows the [official AI SDK provider pattern](https://ai-sdk.dev/providers/community-providers/custom-providers) — only `zod` is required as a peer dependency. The `ai` package should be installed separately in your app.

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

### Tool Calling

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { generateText, tool } from 'ai';
import { z } from 'zod/v4';

const { text } = await generateText({
  model: telnyx('Qwen/Qwen3-235B-A22B'),
  prompt: 'What is the weather in Santiago, Chile?',
  tools: {
    weather: tool({
      description: 'Get the current weather for a location',
      inputSchema: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        return { temperature: 18, condition: 'sunny', location };
      },
    }),
  },
});
```

### Embeddings

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { embed, embedMany } from 'ai';

// Single embedding
const { embedding } = await embed({
  model: telnyx.embeddingModel('thenlper/gte-large'),
  value: 'What is WebRTC?',
});

// Batch embeddings
const { embeddings } = await embedMany({
  model: telnyx.embeddingModel('thenlper/gte-large'),
  values: ['What is WebRTC?', 'Explain SIP trunking'],
});
```

### Text-to-Speech (TTS)

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { experimental_generateSpeech as generateSpeech } from 'ai';

const { audio } = await generateSpeech({
  model: telnyx.speechModel('tts-1'),
  text: 'Hello, welcome to Telnyx!',
  voice: '29vDchNbjg4S6lPckOMX', // voice ID from Telnyx voices catalog
});
```

You can also pass provider-specific options:

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { experimental_generateSpeech as generateSpeech } from 'ai';

const { audio } = await generateSpeech({
  model: telnyx.speechModel('tts-1'),
  text: 'Hello, welcome to Telnyx!',
  voice: '29vDchNbjg4S6lPckOMX',
  providerOptions: {
    telnyx: {
      outputFormat: 'mp3',
      speed: 1.0,
      language: 'en',
    },
  },
});
```

Browse available voices at the [Telnyx Voices API](https://api.telnyx.com/v2/text-to-speech/voices) — 3,301 voices across 7 providers.

### Custom Instance

```typescript
import { createTelnyx } from '@telnyx/ai-sdk-provider';

const telnyx = createTelnyx({
  apiKey: 'KEY_ID_SECRET',
  baseURL: 'https://api.telnyx.com/v2/ai/openai', // optional override
  headers: { 'X-Custom-Header': 'value' }, // optional custom headers
  fetch: customFetch, // optional custom fetch implementation
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

### Speech Models

| Model ID | Description |
|---|---|
| `tts-1` | Optimized for speed |
| `tts-1-hd` | Optimized for quality |

> **Note:** TTS requires `ai@6` or later (`SpeechModelV3`).

## Compatibility

| AI SDK Version | Chat | Embeddings | TTS |
|---|:---:|:---:|:---:|
| `ai@4` | ✅ | ✅ | ❌ |
| `ai@5` | ✅ | ✅ | ❌ |
| `ai@6` | ✅ | ✅ | ✅ |

## License

MIT
