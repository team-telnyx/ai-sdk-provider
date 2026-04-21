/**
 * Telnyx Chat Model IDs
 *
 * These are the available chat models on Telnyx Inference.
 * See: https://api.telnyx.com/v2/ai/chat/completions
 */
export type TelnyxChatModelId =
  | 'moonshotai/Kimi-K2.5'
  | 'zai-org/GLM-5.1-FP8'
  | 'MiniMaxAI/MiniMax-M2.7'
  | 'Qwen/Qwen3-235B-A22B';

/**
 * Telnyx Embedding Model IDs
 */
export type TelnyxEmbeddingModelId = 'thenlper/gte-large';

/**
 * Telnyx Speech (TTS) Model IDs
 */
export type TelnyxSpeechModelId = string;

/**
 * Telnyx Transcription (STT) Model IDs
 */
export type TelnyxTranscriptionModelId = string;
