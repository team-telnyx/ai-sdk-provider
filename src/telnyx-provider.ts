import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { loadApiKey, withUserAgentSuffix } from '@ai-sdk/provider-utils';
import {
  NoSuchModelError,
  type EmbeddingModelV4,
  type ImageModelV4,
  type LanguageModelV4,
  type ProviderV4,
  type SpeechModelV4,
  type TranscriptionModelV4,
} from '@ai-sdk/provider';
import type {
  TelnyxChatModelId,
  TelnyxEmbeddingModelId,
  TelnyxSpeechModelId,
  TelnyxTranscriptionModelId,
} from './telnyx-models.js';
import { TelnyxSpeechModel } from './telnyx-speech-model.js';
import { TelnyxTranscriptionModel } from './telnyx-transcription-model.js';
import { VERSION } from './version.js';

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
 * const telnyx = createTelnyx({ apiKey: 'your-key' });
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

  // API key resolution using loadApiKey from @ai-sdk/provider-utils.
  // This provides a consistent, clear LoadAPIKeyError for all model types
  // when no key is configured.
  const apiKey = loadApiKey({
    apiKey: options.apiKey,
    environmentVariableName: 'TELNYX_API_KEY',
    description: 'Telnyx',
  });

  const openaiCompatible = createOpenAICompatible({
    name: 'telnyx',
    baseURL,
    apiKey,
    transformRequestBody: (body) => {
      // Telnyx API requires tool function parameters to have explicit type: "object".
      // The AI SDK may omit this field, so we inject it here.
      if (body.tools && Array.isArray(body.tools)) {
        body.tools = body.tools.map((tool: Record<string, unknown>) => {
          const fn = tool.function as Record<string, unknown> | undefined;
          if (fn?.parameters && typeof fn.parameters === 'object') {
            const params = fn.parameters as Record<string, unknown>;
            if (!params.type) {
              fn.parameters = { type: 'object', ...params };
            }
          }
          return tool;
        });
      }
      return body;
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
  // Factory functions (defined once, aliased below)
  const getHeaders = () =>
    withUserAgentSuffix(
      { Authorization: `Bearer ${apiKey}` },
      `telnyx/ai-sdk-provider/${VERSION}`,
    );

  const createSpeechModel = (modelId: TelnyxSpeechModelId) =>
    new TelnyxSpeechModel(modelId, {
      provider: 'telnyx.speech',
      baseURL: baseURL.replace('/v2/ai/openai', '/v2'),
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createTranscriptionModel = (modelId: TelnyxTranscriptionModelId) =>
    new TelnyxTranscriptionModel(modelId, {
      provider: 'telnyx.transcription',
      baseURL: baseURL.replace('/v2/ai/openai', '/v2'),
      headers: getHeaders,
      fetch: options.fetch,
    });

  const provider = Object.assign(
    // Default: language model
    (modelId: TelnyxChatModelId) => openaiCompatible.languageModel(modelId),
    {
      specificationVersion: 'v4' as const,
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
       * Telnyx does not support image models.
       * @throws {NoSuchModelError}
       */
      imageModel: (modelId: string): ImageModelV4 => {
        throw new NoSuchModelError({
          modelId,
          modelType: 'imageModel',
          message: 'Telnyx does not provide image models',
        });
      },

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
       * Alias for `speech()` to match the ProviderV4 interface.
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
       * Alias for `transcription()` to match the ProviderV4 interface.
       */
      transcriptionModel: createTranscriptionModel,
    },
  );

  return provider as TelnyxProvider;
}

/**
 * Telnyx provider interface following the AI SDK ProviderV4 specification.
 */
export interface TelnyxProvider extends ProviderV4 {
  /**
   * Call the provider as a function to get a language model.
   */
  (modelId: TelnyxChatModelId): LanguageModelV4;

  readonly specificationVersion: 'v4';

  /**
   * Get a language model (chat completions).
   */
  languageModel(modelId: TelnyxChatModelId): LanguageModelV4;

  /**
   * Get an embedding model.
   */
  embeddingModel(modelId: TelnyxEmbeddingModelId): EmbeddingModelV4;

  /**
   * Get a speech model (TTS).
   */
  speech(modelId: TelnyxSpeechModelId): SpeechModelV4;

  /**
   * Get a speech model (TTS).
   * Alias for `speech()` to match the ProviderV4 interface.
   */
  speechModel(modelId: TelnyxSpeechModelId): SpeechModelV4;

  /**
   * Get a transcription model (STT).
   */
  transcription(modelId: TelnyxTranscriptionModelId): TranscriptionModelV4;

  /**
   * Get a transcription model (STT).
   * Alias for `transcription()` to match the ProviderV4 interface.
   */
  transcriptionModel(modelId: TelnyxTranscriptionModelId): TranscriptionModelV4;
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
// Lazy-initialized default export. This avoids throwing LoadAPIKeyError
// at import time when TELNYX_API_KEY is not set. The provider is created
// on first actual use (calling the provider or its methods), deferring
// the API key validation until a request is made.
let _telnyx: ReturnType<typeof createTelnyx> | undefined;

function getTelnyx(): ReturnType<typeof createTelnyx> {
  if (!_telnyx) {
    _telnyx = createTelnyx();
  }
  return _telnyx;
}

// Callable function with lazy-initialized properties.
// Object.defineProperties preserves getters (Object.assign would eagerly
// evaluate them). Accessing properties like `telnyx.speech` is safe without
// an API key — it returns a function. The LoadAPIKeyError is only thrown
// when the returned function is actually invoked.
const _telnyxFn = (modelId: string) =>
  getTelnyx()(modelId as TelnyxChatModelId);

Object.defineProperties(_telnyxFn, {
  specificationVersion: {
    value: 'v4' as const,
    enumerable: true,
    writable: false,
  },
  languageModel: {
    get: () => (...args: Parameters<ReturnType<typeof createTelnyx>['languageModel']>) =>
      getTelnyx().languageModel(...args),
    enumerable: true,
  },
  embeddingModel: {
    get: () => (...args: Parameters<ReturnType<typeof createTelnyx>['embeddingModel']>) =>
      getTelnyx().embeddingModel(...args),
    enumerable: true,
  },
  speech: {
    get: () => (...args: Parameters<ReturnType<typeof createTelnyx>['speech']>) =>
      getTelnyx().speech(...args),
    enumerable: true,
  },
  speechModel: {
    get: () => (...args: Parameters<ReturnType<typeof createTelnyx>['speechModel']>) =>
      getTelnyx().speechModel(...args),
    enumerable: true,
  },
  transcription: {
    get: () => (...args: Parameters<ReturnType<typeof createTelnyx>['transcription']>) =>
      getTelnyx().transcription(...args),
    enumerable: true,
  },
  transcriptionModel: {
    get: () => (...args: Parameters<ReturnType<typeof createTelnyx>['transcriptionModel']>) =>
      getTelnyx().transcriptionModel(...args),
    enumerable: true,
  },
});

export const telnyx = _telnyxFn as TelnyxProvider;
