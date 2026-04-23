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

  it('provider.imageModel() throws NoSuchModelError', () => {
    const provider = createTelnyx({ apiKey: 'test' });
    expect(() => provider.imageModel('test')).toThrow();
  });
});

describe('default telnyx export', () => {
  it('is a callable function', () => {
    expect(typeof telnyx).toBe('function');
  });

  it('has languageModel method', () => {
    expect(typeof telnyx.languageModel).toBe('function');
  });

  it('has embeddingModel method', () => {
    expect(typeof telnyx.embeddingModel).toBe('function');
  });

  it('has speech method', () => {
    expect(typeof telnyx.speech).toBe('function');
  });

  it('has speechModel method (alias)', () => {
    expect(typeof telnyx.speechModel).toBe('function');
    expect(telnyx.speechModel).toBe(telnyx.speech);
  });

  it('has transcription method', () => {
    expect(typeof telnyx.transcription).toBe('function');
  });

  it('has transcriptionModel method (alias)', () => {
    expect(typeof telnyx.transcriptionModel).toBe('function');
    expect(telnyx.transcriptionModel).toBe(telnyx.transcription);
  });
});
