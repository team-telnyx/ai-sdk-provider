import type { SpeechModelV4, SpeechModelV4CallOptions, SharedV4Warning } from '@ai-sdk/provider';
import {
  combineHeaders,
  createBinaryResponseHandler,
  createStatusCodeErrorResponseHandler,
  parseProviderOptions,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

/**
 * Schema for Telnyx-specific speech model options
 * passed via `providerOptions.telnyx`.
 */
const telnyxSpeechModelOptionsSchema = z.object({
  /**
   * Output audio format (e.g. "mp3", "wav", "pcm").
   * If not set, defaults to the format returned by the API (typically mp3).
   */
  output_format: z.string().optional(),

  /**
   * Sample rate for PCM output (e.g. 16000, 24000).
   * Only applies when output_format is "pcm" or "linear16".
   */
  sample_rate: z.number().optional(),

  /**
   * Language code override (e.g. "en", "es").
   * If not set, the voice's default language is used.
   */
  language_code: z.string().optional(),
});

export type TelnyxSpeechModelOptions = z.infer<
  typeof telnyxSpeechModelOptionsSchema
>;

export interface TelnyxSpeechModelConfig {
  readonly provider: string;
  readonly baseURL: string;
  readonly headers: () => Record<string, string | undefined>;
  readonly fetch?: typeof globalThis.fetch;
  readonly _internal?: {
    currentDate?: () => Date;
  };
}

/**
 * Telnyx Speech (TTS) model implementation for the AI SDK.
 *
 * Uses the Telnyx TTS REST API: `POST /v2/text-to-speech/speech`
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
export class TelnyxSpeechModel implements SpeechModelV4 {
  readonly specificationVersion = 'v4' as const;

  constructor(
    readonly modelId: string,
    private readonly config: TelnyxSpeechModelConfig,
  ) {}

  get provider(): string {
    return this.config.provider;
  }

  async doGenerate(
    options: SpeechModelV4CallOptions,
  ): Promise<Awaited<ReturnType<SpeechModelV4['doGenerate']>>> {
    const currentDate =
      this.config._internal?.currentDate?.() ?? new Date();

    const warnings: SharedV4Warning[] =
      [];

    // Parse provider-specific options
    const telnyxOptions = await parseProviderOptions({
      provider: 'telnyx',
      providerOptions: options.providerOptions,
      schema: telnyxSpeechModelOptionsSchema,
    });

    // Build request body
    const requestBody: Record<string, unknown> = {
      text: options.text,
      voice: options.voice ?? 'Telnyx.NaturalHD.astra',
    };

    // Map outputFormat to Telnyx output_format
    if (options.outputFormat) {
      const formatMap: Record<string, string> = {
        mp3: 'mp3',
        wav: 'wav',
        pcm: 'linear16',
        'linear16': 'linear16',
        ulaw: 'ulaw',
      };
      const mappedFormat =
        formatMap[options.outputFormat] ?? options.outputFormat;
      requestBody.output_format = mappedFormat;
    }

    // Override from providerOptions (takes precedence)
    if (telnyxOptions?.output_format) {
      requestBody.output_format = telnyxOptions.output_format;
    }

    if (telnyxOptions?.sample_rate) {
      requestBody.sample_rate = telnyxOptions.sample_rate;
    }

    // Language mapping
    if (options.language) {
      requestBody.language_code = options.language;
    }
    if (telnyxOptions?.language_code) {
      requestBody.language_code = telnyxOptions.language_code;
    }

    // Speed
    if (options.speed != null) {
      requestBody.speed = options.speed;
    }

    // Instructions — Telnyx TTS API does not support instructions
    if (options.instructions) {
      warnings.push({
        type: 'unsupported' as const,
        feature: 'instructions',
        details:
          'Telnyx speech models do not support instructions. The instructions parameter was ignored.',
      });
    }

    // Make the API call
    const { value: audio, responseHeaders } = await postJsonToApi({
      url: `${this.config.baseURL}/text-to-speech/speech`,
      headers: combineHeaders(this.config.headers(), options.headers),
      body: requestBody,
      failedResponseHandler: createStatusCodeErrorResponseHandler(),
      successfulResponseHandler: createBinaryResponseHandler(),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    return {
      audio: audio as Uint8Array,
      warnings,
      request: { body: JSON.stringify(requestBody) },
      response: {
        timestamp: currentDate,
        modelId: this.modelId,
        headers: responseHeaders,
      },
    };
  }
}
