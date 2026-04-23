import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { loadApiKey } from '@ai-sdk/provider-utils';
import type {
  TelnyxChatModelId,
  TelnyxEmbeddingModelId,
  TelnyxSpeechModelId,
  TelnyxTranscriptionModelId,
} from './telnyx-models.js';
import { TelnyxSpeechModel } from './telnyx-speech-model.js';
import { TelnyxTranscriptionModel } from './telnyx-transcription-model.js';

/**
 * Telnyx provider configuration options.
 */
export interface TelnyxProviderSettings {
  /**
   * API key for Telnyx.
   * Format: {key_id}_{secret}
   * Can also be set via TELNYX_API_KEY environment variable.
   */
  apiKey?: string;

  /**
   * Base URL for the Telnyx Inference API.
   * Defaults to https://api.telnyx.com/v2/ai/openai
   */
  baseURL?: string;

  /**
   * Custom fetch function for making HTTP requests.
   * Useful for testing or custom request handling.
   */
  fetch?: typeof globalThis.fetch;
}

/**
 * Create a Telnyx provider for the Vercel AI SDK.
 *
 * @example
 * ```typescript
 * import { createTelnyx } from '@telnyx/ai-sdk-provider';
 * import { generateText } from 'ai';
 *
 * const telnyx = createTelnyx({ apiKey: 'KEY_ID_SECRET' });
 *
 * const { text } = await generateText({
 *   model: telnyx('Qwen/Qwen3-235B-A22B'),
 *   prompt: 'Hello!',
 * });
 * ```
 */
export function createTelnyx(options: TelnyxProviderSettings = {}) {
  const baseURL =
    options.baseURL ?? process.env.TELNYX_BASE_URL ??
    'https://api.telnyx.com/v2/ai/openai';

  // Lazy API key resolution: loadApiKey is called when the provider
  // is instantiated. If no apiKey is provided and TELNYX_API_KEY is not
  // set, loadApiKey will throw a helpful error message.
  const apiKey = options.apiKey ?? process.env.TELNYX_API_KEY;

  const openaiCompatible = createOpenAICompatible({
    name: 'telnyx',
    baseURL,
    ...(apiKey ? { apiKey } : {}),
  });

  /**
   * Telnyx provider instance.
   *
   * Can be called as a function to get a language model:
   * `telnyx('Qwen/Qwen3-235B-A22B')`
   *
   * Or use explicit methods for other model types:
   * `telnyx.embeddingModel('thenlper/gte-large')`
   */
  // Factory functions (defined once, aliased below)
  const createSpeechModel = (modelId: TelnyxSpeechModelId) =>
    new TelnyxSpeechModel(modelId, {
      provider: 'telnyx.speech',
      baseURL: baseURL.replace('/v2/ai/openai', '/v2'),
      headers: () => ({
        Authorization: `Bearer ${loadApiKey({
          apiKey: options.apiKey,
          environmentVariableName: 'TELNYX_API_KEY',
          description: 'Telnyx',
        })}`,
      }),
      fetch: options.fetch,
    });

  const createTranscriptionModel = (modelId: TelnyxTranscriptionModelId) =>
    new TelnyxTranscriptionModel(modelId, {
      provider: 'telnyx.transcription',
      baseURL: baseURL.replace('/v2/ai/openai', '/v2'),
      headers: () => ({
        Authorization: `Bearer ${loadApiKey({
          apiKey: options.apiKey,
          environmentVariableName: 'TELNYX_API_KEY',
          description: 'Telnyx',
        })}`,
      }),
      fetch: options.fetch,
    });

  const provider = Object.assign(
    // Default: language model
    (modelId: TelnyxChatModelId) => openaiCompatible.languageModel(modelId),
    {
      /**
       * Get a language model (chat completions).
       */
      languageModel: (modelId: TelnyxChatModelId) =>
        openaiCompatible.languageModel(modelId),

      /**
       * Get an embedding model.
       */
      embeddingModel: (modelId: TelnyxEmbeddingModelId) =>
        openaiCompatible.textEmbeddingModel(modelId),

      /**
       * Get a speech model (TTS).
       *
       * Uses the Telnyx Text-to-Speech API to generate audio from text.
       *
       * @param modelId - The speech model ID (e.g. 'tts-1').
       *   This is for logging/categorization only; the actual voice is
       *   specified via the `voice` parameter in `generateSpeech`.
       *
       * @example
       * ```typescript
       * import { experimental_generateSpeech as generateSpeech } from 'ai';
       * import { telnyx } from '@telnyx/ai-sdk-provider';
       *
       * const { audio } = await generateSpeech({
       *   model: telnyx.speech('tts-1'),
       *   text: 'Hello, world!',
       *   voice: 'Telnyx.NaturalHD.astra',
       * });
       * ```
       */
      speech: createSpeechModel,

      /**
       * Get a speech model (TTS).
       * Alias for `speech()` to match the ProviderV3/V4 interface.
       */
      speechModel: createSpeechModel,

      /**
       * Get a transcription model (STT).
       *
       * Uses the Telnyx Speech-to-Text REST API to transcribe audio files.
       * This endpoint is OpenAI-compatible.
       *
       * Supported models:
       * - `distil-whisper/distil-large-v2` — low latency, English-only
       * - `openai/whisper-large-v3-turbo` — multilingual
       * - `deepgram/nova-3` — English variants, supports diarization
       *
       * @param modelId - The transcription model ID.
       *
       * @example
       * ```typescript
       * import { experimental_transcribe as transcribe } from 'ai';
       * import { telnyx } from '@telnyx/ai-sdk-provider';
       * import { readFile } from 'fs/promises';
       *
       * const transcript = await transcribe({
       *   model: telnyx.transcription('distil-whisper/distil-large-v2'),
       *   audio: await readFile('audio.mp3'),
       * });
       * ```
       */
      transcription: createTranscriptionModel,

      /**
       * Get a transcription model (STT).
       * Alias for `transcription()` to match the ProviderV3/V4 interface.
       */
      transcriptionModel: createTranscriptionModel,
    },
  );

  return provider;
}

/**
 * Default Telnyx provider instance.
 *
 * Uses TELNYX_API_KEY and TELNYX_BASE_URL environment variables.
 *
 * @example
 * ```typescript
 * import { telnyx } from '@telnyx/ai-sdk-provider';
 * import { generateText } from 'ai';
 *
 * const { text } = await generateText({
 *   model: telnyx('Qwen/Qwen3-235B-A22B'),
 *   prompt: 'Hello!',
 * });
 * ```
 */
export const telnyx = createTelnyx();
