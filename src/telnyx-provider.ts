import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type {
  TelnyxChatModelId,
  TelnyxEmbeddingModelId,
  TelnyxSpeechModelId,
  TelnyxTranscriptionModelId,
} from './telnyx-models.js';

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
       * @deprecated Not yet implemented. Will be available in Phase 3.
       */
      speechModel: (_modelId: TelnyxSpeechModelId) => {
        throw new Error(
          'Speech models are not yet implemented. Will be available in a future release.',
        );
      },

      /**
       * Get a transcription model (STT).
       * @deprecated Not yet implemented. Will be available in Phase 3.
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
