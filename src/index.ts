/**
 * @telnyx/ai-sdk-provider
 *
 * Telnyx provider for the Vercel AI SDK.
 * LLM + Embeddings + TTS + STT in a single package.
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

export { telnyx, createTelnyx } from './telnyx-provider.js';
export { VERSION } from './version.js';
export type {
  TelnyxProviderSettings,
} from './telnyx-provider.js';
export type {
  TelnyxChatModelId,
  TelnyxEmbeddingModelId,
  TelnyxSpeechModelId,
  TelnyxTranscriptionModelId,
} from './telnyx-models.js';
