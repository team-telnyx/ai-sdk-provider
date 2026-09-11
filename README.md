# @telnyx/ai-sdk-provider

Telnyx provider for the [Vercel AI SDK](https://ai-sdk.dev), with support for chat, embeddings, speech generation, and transcription.

## Requirements

- **Node.js** >= 22
- **AI SDK** 7 (`ai@^7`)
- **Zod** (`zod@^3.25 || ^4`)

## Setup

```bash
npm install ai@^7 @telnyx/ai-sdk-provider zod
```

`zod` is a required peer dependency. This package imports `zod/v4` internally for speech and transcription model schemas, so consumers must install it even if they are not using tool calling.

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

### Structured Output

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod/v4';

const { object } = await generateObject({
  model: telnyx('meta-llama/Meta-Llama-3.1-8B-Instruct'),
  schema: z.object({
    name: z.string(),
    age: z.number(),
  }),
  prompt: 'Generate a fictional person named John who is 30 years old.',
});

console.log(object); // { name: 'John', age: 30 }
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
  model: telnyx.speech('Telnyx.KokoroTTS.af_alloy'),
  text: 'Hello, welcome to Telnyx!',
  voice: 'Telnyx.NaturalHD.astra',
});
```

You can also pass additional speech options:

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { experimental_generateSpeech as generateSpeech } from 'ai';

const { audio, warnings } = await generateSpeech({
  model: telnyx.speech('Telnyx.KokoroTTS.af_alloy'),
  text: 'Hello, welcome to Telnyx!',
  voice: 'Telnyx.KokoroTTS.af_alloy',
  outputFormat: 'mp3',
});
```

Provider-specific options are also supported via `providerOptions.telnyx`:

```typescript
const { audio } = await generateSpeech({
  model: telnyx.speech('Telnyx.NaturalHD.astra'),
  text: 'Hello, welcome to Telnyx!',
  voice: 'Telnyx.NaturalHD.astra',
  providerOptions: {
    telnyx: {
      output_format: 'linear16',
      sample_rate: 24000,
      language_code: 'en',
    },
  },
});
```

### Transcription (STT)

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { experimental_transcribe as transcribe } from 'ai';
import { readFile } from 'node:fs/promises';

const result = await transcribe({
  model: telnyx.transcriptionModel('distil-whisper/distil-large-v2'),
  audio: await readFile('./audio.wav'),
});

console.log(result.text);
```

> **Note:** AI SDK 7 auto-detects the audio media type via `detectMediaType()`.
> The `mediaType` parameter is no longer needed (and not accepted) in v7.

You can also use provider-specific options:

```typescript
const result = await transcribe({
  model: telnyx.transcriptionModel('openai/whisper-large-v3-turbo'),
  audio: await readFile('./audio.wav'),
  providerOptions: {
    telnyx: {
      language: 'en',
      response_format: 'verbose_json',
    },
  },
});
```

### Custom Instance

```typescript
import { createTelnyx } from '@telnyx/ai-sdk-provider';

const telnyx = createTelnyx({
  apiKey: 'your_api_key',
  baseURL: 'https://api.telnyx.com/v2/ai/openai',
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
| `openai/gpt-4o` | General purpose |
| `anthropic/claude-haiku-4-5` | Fast, efficient |
| `google/gemini-2.5-flash` | Multimodal, fast |

See `src/telnyx-models.ts` for the full list of supported model IDs.

### Embedding Models

| Model ID | Dimensions |
|---|---|
| `thenlper/gte-large` | 1024 |

### Speech Models (TTS)

The `modelId` passed to `telnyx.speech()` is used as the AI SDK model identifier for metadata/logging. The actual synthesis is controlled by the `voice` parameter and `providerOptions.telnyx`.

| Voice | Provider |
|---|---|
| `Telnyx.NaturalHD.astra` | NaturalHD |
| `Telnyx.KokoroTTS.af_alloy` | KokoroTTS |

See the [Telnyx TTS docs](https://developers.telnyx.com/docs/voice/programmable-voice/tts) for available voices.

### Transcription Models

Examples:
- `distil-whisper/distil-large-v2`
- `openai/whisper-large-v3-turbo`
- `deepgram/nova-3`

## Exports

```typescript
import {
  telnyx,
  createTelnyx,
  VERSION,
  type TelnyxProviderSettings,
  type TelnyxChatModelId,
  type TelnyxEmbeddingModelId,
  type TelnyxSpeechModelId,
  type TelnyxTranscriptionModelId,
} from '@telnyx/ai-sdk-provider';
```

## Notes

- `telnyx('model-id')` is an alias for `telnyx.languageModel('model-id')`
- `telnyx.speech()` and `telnyx.speechModel()` are equivalent
- `telnyx.transcription()` and `telnyx.transcriptionModel()` are equivalent
- `imageModel()` is not supported and throws `NoSuchModelError`
- The default `telnyx` export is lazy, so importing it does not require `TELNYX_API_KEY` until first use

## Changelog

### v2.0.0

**Breaking change** — upgraded to AI SDK 7 (Provider V4).

- **Breaking**: Requires `ai@^7` (previously `ai@^6`)
- **Breaking**: Requires Node.js >= 22 (previously >= 18)
- Migrated all provider interfaces from V3 to V4 (`ProviderV3` → `ProviderV4`, `LanguageModelV3` → `LanguageModelV4`, etc.)
- `specificationVersion` changed from `'v3'` to `'v4'`
- `mediaType` parameter removed from `transcribe()` (AI SDK 7 auto-detects via `detectMediaType`)
- `LanguageModelUsage` `inputTokens`/`outputTokens` are now optional (may be `undefined` in streaming)
- Security fixes: vitest 3→4, npm audit fixes (nanoid, postcss, vite)

### v1.0.0

Initial release. AI SDK 6 / Provider V3.

## License

MIT
