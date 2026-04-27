# @telnyx/ai-sdk-provider

Telnyx provider for the [Vercel AI SDK](https://ai-sdk.dev), with support for chat, embeddings, speech generation, and transcription.

## Setup

```bash
npm install ai @telnyx/ai-sdk-provider zod
```

`zod` is required when using tool calling schemas in your app.

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
  voice: 'Telnyx.NaturalHD.astra',
});
```

You can also pass additional speech options:

```typescript
import { telnyx } from '@telnyx/ai-sdk-provider';
import { experimental_generateSpeech as generateSpeech } from 'ai';

const { audio, warnings } = await generateSpeech({
  model: telnyx.speechModel('tts-1'),
  text: 'Hello, welcome to Telnyx!',
  voice: 'Telnyx.KokoroTTS.af_alloy',
  outputFormat: 'mp3',
});
```

Provider-specific options are also supported via `providerOptions.telnyx`:

```typescript
const { audio } = await generateSpeech({
  model: telnyx.speechModel('tts-1'),
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
  mediaType: 'audio/wav',
});

console.log(result.text);
```

You can also use provider-specific options:

```typescript
const result = await transcribe({
  model: telnyx.transcriptionModel('openai/whisper-large-v3-turbo'),
  audio: await readFile('./audio.wav'),
  mediaType: 'audio/wav',
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
  apiKey: 'KEY_ID_SECRET',
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

### Embedding Models

| Model ID | Dimensions |
|---|---|
| `thenlper/gte-large` | 1024 |

### Speech Models

| Model ID | Description |
|---|---|
| `tts-1` | Text-to-speech model |
| `tts-1-hd` | Higher-quality text-to-speech model |

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
- Requires `ai@6` for speech and transcription APIs

## License

MIT
