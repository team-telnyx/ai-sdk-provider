import type {
  TranscriptionModelV3,
  TranscriptionModelV3CallOptions,
  SharedV3Warning,
} from '@ai-sdk/provider';
import {
  combineHeaders,
  createJsonResponseHandler,
  createStatusCodeErrorResponseHandler,
  postFormDataToApi,
  convertToFormData,
  parseProviderOptions,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

/**
 * Schema for Telnyx-specific transcription model options
 * passed via `providerOptions.telnyx`.
 */
const telnyxTranscriptionModelOptionsSchema = z.object({
  /**
   * The format of the transcript output.
   * Use "verbose_json" to take advantage of timestamps.
   */
  response_format: z.enum(['json', 'verbose_json']).optional(),

  /**
   * The timestamp granularities to populate for this transcription.
   * `response_format` must be set to "verbose_json" to use this.
   * Currently "segment" is supported.
   */
  timestamp_granularities: z.array(z.enum(['segment'])).optional(),

  /**
   * The language of the audio to be transcribed.
   * For deepgram/nova-3, only English variants are supported.
   * For openai/whisper-large-v3-turbo, supports multiple languages.
   * distil-whisper/distil-large-v2 does not support language parameter.
   */
  language: z.string().optional(),

  /**
   * Additional model-specific configuration parameters.
   * Only allowed with deepgram/nova-3 model.
   */
  model_config: z.record(z.string(), z.unknown()).optional(),
});

export type TelnyxTranscriptionModelOptions = z.infer<
  typeof telnyxTranscriptionModelOptionsSchema
>;

export interface TelnyxTranscriptionModelConfig {
  readonly provider: string;
  readonly baseURL: string;
  readonly headers: () => Record<string, string | undefined>;
  readonly fetch?: typeof globalThis.fetch;
  readonly _internal?: {
    currentDate?: () => Date;
  };
}

/**
 * Telnyx Transcription (STT) model implementation for the AI SDK.
 *
 * Uses the Telnyx Speech-to-Text REST API: `POST /v2/ai/audio/transcriptions`
 * This endpoint is OpenAI-compatible and supports file-based transcription.
 *
 * Supported models:
 * - `distil-whisper/distil-large-v2` — low latency, English-only
 * - `openai/whisper-large-v3-turbo` — multilingual
 * - `deepgram/nova-3` — English variants, supports diarization
 *
 * @example
 * ```typescript
 * import { experimental_transcribe as transcribe } from 'ai';
 * import { telnyx } from '@telnyx/ai-sdk-provider';
 * import { readFile } from 'fs/promises';
 *
 * const transcript = await transcribe({
 *   model: telnyx.transcriptionModel('distil-whisper/distil-large-v2'),
 *   audio: await readFile('audio.mp3'),
 * });
 * ```
 */
export class TelnyxTranscriptionModel implements TranscriptionModelV3 {
  readonly specificationVersion = 'v3' as const;

  constructor(
    readonly modelId: string,
    private readonly config: TelnyxTranscriptionModelConfig,
  ) {}

  get provider(): string {
    return this.config.provider;
  }

  async doGenerate(
    options: TranscriptionModelV3CallOptions,
  ): Promise<Awaited<ReturnType<TranscriptionModelV3['doGenerate']>>> {
    const currentDate =
      this.config._internal?.currentDate?.() ?? new Date();

    const warnings: SharedV3Warning[] = [];

    // Parse provider-specific options
    const telnyxOptions = await parseProviderOptions({
      provider: 'telnyx',
      providerOptions: options.providerOptions,
      schema: telnyxTranscriptionModelOptionsSchema,
    });

    // Determine media type and file extension
    const mediaType = options.mediaType;
    const extension = mediaTypeToExtension(mediaType);

    // Build form data fields
    const formDataFields: Record<string, unknown> = {
      model: this.modelId,
    };

    // Add response_format
    if (telnyxOptions?.response_format) {
      formDataFields.response_format = telnyxOptions.response_format;
    } else {
      // Default to verbose_json to get segments + duration
      formDataFields.response_format = 'verbose_json';
    }

    // Add timestamp_granularities from providerOptions
    // Note: OpenAI-compatible API expects this as repeated form field
    // e.g. timestamp_granularities[]=segment
    if (telnyxOptions?.timestamp_granularities?.length) {
      // Convert array to bracketed form fields
      for (const granularity of telnyxOptions.timestamp_granularities) {
        formDataFields['timestamp_granularities[]'] = granularity;
      }
    }

    // Add language from providerOptions
    if (telnyxOptions?.language) {
      formDataFields.language = telnyxOptions.language;
    }

    // Add model_config from providerOptions
    if (telnyxOptions?.model_config) {
      formDataFields.model_config = JSON.stringify(
        telnyxOptions.model_config,
      );
    }

    // Handle audio data — convert to Blob for FormData
    let audioData: Uint8Array;
    if (typeof options.audio === 'string') {
      // Base64 encoded string
      audioData = base64ToUint8Array(options.audio);
    } else {
      audioData = options.audio;
    }

    const audioBlob = new Blob([audioData.buffer as ArrayBuffer], { type: mediaType });
    const filename = `audio.${extension}`;

    // Convert to FormData
    const formData = convertToFormData(formDataFields);

    // Append the audio file
    formData.append('file', audioBlob, filename);

    // Make the API call
    const { value: response, responseHeaders } =
      await postFormDataToApi({
        url: `${this.config.baseURL}/ai/audio/transcriptions`,
        headers: combineHeaders(this.config.headers(), options.headers),
        formData,
        failedResponseHandler: createStatusCodeErrorResponseHandler(),
        successfulResponseHandler: createJsonResponseHandler(
          transcriptionResponseSchema,
        ),
        abortSignal: options.abortSignal,
        fetch: this.config.fetch,
      });

    // Map response to AI SDK format
    const segments: Array<{
      text: string;
      startSecond: number;
      endSecond: number;
    }> = [];

    if (response.segments && Array.isArray(response.segments)) {
      for (const seg of response.segments) {
        segments.push({
          text: seg.text,
          startSecond: seg.start,
          endSecond: seg.end,
        });
      }
    }

    return {
      text: response.text ?? '',
      segments,
      language: telnyxOptions?.language ?? undefined,
      durationInSeconds: response.duration ?? undefined,
      warnings,
      request: {
        body: `[multipart form-data: model=${this.modelId}, file=${filename}]`,
      },
      response: {
        timestamp: currentDate,
        modelId: this.modelId,
        headers: responseHeaders,
      },
    };
  }
}

/**
 * Response schema for the Telnyx transcription API.
 */
const transcriptionResponseSchema = z.object({
  text: z.string(),
  duration: z.number().optional(),
  segments: z
    .array(
      z.object({
        id: z.number().optional(),
        start: z.number(),
        end: z.number(),
        text: z.string(),
      }),
    )
    .optional(),
  words: z
    .array(
      z.object({
        word: z.string(),
        start: z.number(),
        end: z.number(),
        confidence: z.number().optional(),
        speaker: z.number().optional(),
      }),
    )
    .optional(),
});

/**
 * Convert a media type to a file extension.
 */
function mediaTypeToExtension(mediaType: string): string {
  const map: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/x-wav': 'wav',
    'audio/flac': 'flac',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/webm': 'webm',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
  };

  return map[mediaType] ?? 'wav';
}

/**
 * Decode a base64 string to Uint8Array.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
