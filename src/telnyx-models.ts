/**
 * Telnyx Chat Model IDs
 *
 * These are the available chat models on Telnyx Inference.
 * See: https://api.telnyx.com/v2/ai/openai/chat/completions
 */
export type TelnyxChatModelId =
  | 'anthropic/claude-haiku-4-5'
  | 'anthropic/claude-opus-4-6'
  | 'google/gemini-2.5-flash'
  | 'google/gemma-2b-it'
  | 'Groq/gpt-oss-120b'
  | 'meta-llama/Llama-3.3-70B-Instruct'
  | 'meta-llama/Meta-Llama-3.1-70B-Instruct'
  | 'meta-llama/Meta-Llama-3.1-8B-Instruct'
  | 'MiniMaxAI/MiniMax-M2.7'
  | 'moonshotai/Kimi-K2.5'
  | 'moonshotai/Kimi-K2.6'
  | 'openai/gpt-4.1'
  | 'openai/gpt-4o'
  | 'openai/gpt-4o-mini'
  | 'openai/gpt-5'
  | 'openai/gpt-5.1'
  | 'openai/gpt-5.2'
  | 'Qwen/Qwen3-235B-A22B'
  | 'zai-org/GLM-5.1-FP8';

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
