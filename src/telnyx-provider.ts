import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type {
  TelnyxChatModelId,
  TelnyxEmbeddingModelId,
  TelnyxSpeechModelId,
  TelnyxTranscriptionModelId,
} from './telnyx-models.js';
import { TelnyxSpeechModel } from './telnyx-speech-model.js';

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

  const apiKey = options.apiKey ?? process.env.TELNYX_API_KEY ?? '';

  const openaiCompatible = createOpenAICompatible({
    name: 'telnyx',
    baseURL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
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
       *   model: telnyx.speechModel('tts-1'),
       *   text: 'Hello, world!',
       *   voice: 'Telnyx.NaturalHD.astra',
       * });
       * ```
       */
      speechModel: (modelId: TelnyxSpeechModelId) =>
        new TelnyxSpeechModel(modelId, {
          provider: 'telnyx.speech',
          baseURL: baseURL.replace('/v2/ai/openai', '/v2'),
          headers: () => ({
            Authorization: `Bearer ${apiKey}`,
          }),
          fetch: options.fetch,
        }),

      /**
       * Get a transcription model (STT).
       * Not yet implemented. Will be available in a future release.
       */
      transcriptionModel: (_modelId: TelnyxTranscriptionModelId) => {
        throw new Error(
          'Transcription models are not yet implemented. Will be available in a future release.',
        );
      },
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
