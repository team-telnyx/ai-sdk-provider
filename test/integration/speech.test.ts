import { describe, it, expect } from 'vitest';
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { createTelnyx } from '../../src/telnyx-provider';
import { API_KEY } from '../utils';

const describe_integration = describe.skipIf(!API_KEY);

describe_integration('Telnyx Speech (TTS) Integration', () => {
  const telnyx = createTelnyx({ apiKey: API_KEY! });

  it('should generate speech with default voice', async () => {
    const result = await generateSpeech({
      model: telnyx.speechModel('tts-1'),
      text: 'Hello, this is a test of Telnyx text to speech.',
    });

    expect(result.audio).toBeDefined();
    expect(result.audio.uint8Array).toBeInstanceOf(Uint8Array);
    expect(result.audio.uint8Array.length).toBeGreaterThan(0);
    expect(result.audio.mediaType).toBe('audio/mpeg');
    expect(result.warnings).toEqual([]);
  }, 30000);

  it('should generate speech with a specific NaturalHD voice', async () => {
    const result = await generateSpeech({
      model: telnyx.speechModel('tts-1'),
      text: 'The weather in Santiago is sunny and warm today.',
      voice: 'Telnyx.NaturalHD.astra',
    });

    expect(result.audio.uint8Array.length).toBeGreaterThan(0);
    expect(result.audio.mediaType).toBe('audio/mpeg');
  }, 30000);

  it('should generate speech with a KokoroTTS voice', async () => {
    const result = await generateSpeech({
      model: telnyx.speechModel('tts-1'),
      text: 'Testing with a different voice engine.',
      voice: 'Telnyx.KokoroTTS.af_alloy',
    });

    expect(result.audio.uint8Array.length).toBeGreaterThan(0);
  }, 30000);

  it('should generate speech with output format specified', async () => {
    const result = await generateSpeech({
      model: telnyx.speechModel('tts-1'),
      text: 'Testing output format parameter.',
      voice: 'Telnyx.NaturalHD.astra',
      outputFormat: 'mp3',
    });

    expect(result.audio.uint8Array.length).toBeGreaterThan(0);
  }, 30000);

  it('should warn when instructions are provided (unsupported)', async () => {
    const result = await generateSpeech({
      model: telnyx.speechModel('tts-1'),
      text: 'Testing instructions warning.',
      voice: 'Telnyx.NaturalHD.astra',
      instructions: 'Speak in a happy tone.',
    });

    expect(result.audio.uint8Array.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0].type).toBe('unsupported');
    expect(result.warnings[0].feature).toBe('instructions');
  }, 30000);

  it('should include response metadata', async () => {
    const result = await generateSpeech({
      model: telnyx.speechModel('tts-1'),
      text: 'Checking response metadata.',
      voice: 'Telnyx.NaturalHD.astra',
    });

    expect(result.responses).toBeDefined();
    expect(result.responses.length).toBeGreaterThan(0);
    expect(result.responses[0].timestamp).toBeInstanceOf(Date);
    expect(result.responses[0].modelId).toBe('tts-1');
    expect(result.responses[0].headers).toBeDefined();
  }, 30000);
});
