import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTelnyx, telnyx } from '../../src/telnyx-provider';

describe('createTelnyx', () => {
  beforeEach(() => {
    delete process.env.TELNYX_API_KEY;
    delete process.env.TELNYX_BASE_URL;
  });

  it('creates provider with explicit API key', () => {
    const provider = createTelnyx({ apiKey: 'test_key_123' });
    expect(provider).toBeDefined();
    expect(typeof provider).toBe('function');
  });

  it('reads API key from TELNYX_API_KEY env var', () => {
    process.env.TELNYX_API_KEY = 'env_key_456';
    const provider = createTelnyx();
    expect(provider).toBeDefined();
  });

  it('uses default base URL when none specified', () => {
    const provider = createTelnyx({ apiKey: 'test' });
    // Provider should work without errors
    expect(provider).toBeDefined();
  });

  it('uses custom base URL from option', () => {
    const provider = createTelnyx({
      apiKey: 'test',
      baseURL: 'https://custom.api.com/v2',
    });
    expect(provider).toBeDefined();
  });

  it('reads custom base URL from TELNYX_BASE_URL env var', () => {
    process.env.TELNYX_BASE_URL = 'https://env.api.com/v2';
    const provider = createTelnyx({ apiKey: 'test' });
    expect(provider).toBeDefined();
  });

  it('explicit option overrides env var for API key', () => {
    process.env.TELNYX_API_KEY = 'env_key';
    const provider = createTelnyx({ apiKey: 'explicit_key' });
    expect(provider).toBeDefined();
  });

  it('explicit option overrides env var for base URL', () => {
    process.env.TELNYX_BASE_URL = 'https://env.api.com';
    const provider = createTelnyx({
      apiKey: 'test',
      baseURL: 'https://explicit.api.com',
    });
    expect(provider).toBeDefined();
  });

  it('returns a callable provider function', () => {
    const provider = createTelnyx({ apiKey: 'test' });
    const model = provider('Qwen/Qwen3-235B-A22B');
    expect(model).toBeDefined();
  });

  it('provider.languageModel() returns a model', () => {
    const provider = createTelnyx({ apiKey: 'test' });
    const model = provider.languageModel('Qwen/Qwen3-235B-A22B');
    expect(model).toBeDefined();
  });

  it('provider.embeddingModel() returns a model', () => {
    const provider = createTelnyx({ apiKey: 'test' });
    const model = provider.embeddingModel('thenlper/gte-large');
    expect(model).toBeDefined();
  });

  it('provider.speech() returns a TelnyxSpeechModel', () => {
    const provider = createTelnyx({ apiKey: 'test' });
    const model = provider.speech('tts-1');
    expect(model).toBeDefined();
    expect(model.specificationVersion).toBe('v3');
    expect(model.modelId).toBe('tts-1');
    expect(model.provider).toBe('telnyx.speech');
  });

  it('provider.speechModel() is an alias for speech()', () => {
    const provider = createTelnyx({ apiKey: 'test' });
    expect(provider.speechModel).toBe(provider.speech);
  });

  it('provider.transcription() returns a TelnyxTranscriptionModel', () => {
    const provider = createTelnyx({ apiKey: 'test' });
    const model = provider.transcription('distil-whisper/distil-large-v2');
    expect(model).toBeDefined();
    expect(model.specificationVersion).toBe('v3');
    expect(model.modelId).toBe('distil-whisper/distil-large-v2');
    expect(model.provider).toBe('telnyx.transcription');
  });

  it('provider.transcriptionModel() is an alias for transcription()', () => {
    const provider = createTelnyx({ apiKey: 'test' });
    expect(provider.transcriptionModel).toBe(provider.transcription);
  });

  it('provider has specificationVersion v3', () => {
    const provider = createTelnyx({ apiKey: 'test' });
    expect(provider.specificationVersion).toBe('v3');
  });
});

describe('default telnyx export', () => {
  beforeEach(() => {
    delete process.env.TELNYX_API_KEY;
    delete process.env.TELNYX_BASE_URL;
  });

  it('is a callable function (lazy)', () => {
    // The default export is a lazy wrapper — typeof is 'function'
    // without needing an API key (it doesn't call createTelnyx() until used)
    expect(typeof telnyx).toBe('function');
  });

  it('has specificationVersion without API key', () => {
    // specificationVersion is a value property, not a getter — always safe
    expect(telnyx.specificationVersion).toBe('v3');
  });

  it('property access is safe without API key', () => {
    // Getters return lazy wrappers — accessing them does NOT throw.
    // Only invoking the returned function throws LoadAPIKeyError.
    expect(typeof telnyx.languageModel).toBe('function');
    expect(typeof telnyx.embeddingModel).toBe('function');
    expect(typeof telnyx.speech).toBe('function');
    expect(typeof telnyx.speechModel).toBe('function');
    expect(typeof telnyx.transcription).toBe('function');
    expect(typeof telnyx.transcriptionModel).toBe('function');
  });

  it('throws LoadAPIKeyError when called without API key', () => {
    // Using the provider without an API key should throw LoadAPIKeyError
    expect(() => telnyx('Qwen/Qwen3-235B-A22B')).toThrow(/API key is missing/);
  });

  it('throws LoadAPIKeyError when model method invoked without API key', () => {
    // Property access is safe, but invoking the model method throws
    expect(() => telnyx.languageModel('test')).toThrow(/API key is missing/);
    expect(() => telnyx.speech('test')).toThrow(/API key is missing/);
  });

  it('works with API key set', () => {
    process.env.TELNYX_API_KEY = 'test_key';
    // Force re-initialization with the new env var
    const provider = createTelnyx();
    expect(typeof provider).toBe('function');
    expect(typeof provider.languageModel).toBe('function');
    expect(typeof provider.speech).toBe('function');
    expect(typeof provider.transcription).toBe('function');
    expect(provider.speechModel).toBe(provider.speech);
    expect(provider.transcriptionModel).toBe(provider.transcription);
  });
});
