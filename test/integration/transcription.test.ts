import { describe, expect, it } from 'vitest';
import { telnyx } from '../../src/telnyx-provider';
import { API_KEY } from '../utils';

describe.skipIf(!API_KEY)('Telnyx Transcription (STT)', () => {
  it('transcribes audio from a WAV buffer', async () => {
    const { experimental_transcribe: transcribe } = await import('ai');

    // Create a minimal WAV file with silence (1 second, 16kHz, mono, 16-bit)
    const wavBuffer = createSilentWav(16000, 1);

    const transcript = await transcribe({
      model: telnyx.transcriptionModel('distil-whisper/distil-large-v2'),
      audio: wavBuffer,
      mediaType: 'audio/wav',
      abortSignal: AbortSignal.timeout(30000),
    });

    expect(transcript).toBeDefined();
    expect(typeof transcript.text).toBe('string');
    expect(transcript.segments).toBeDefined();
    expect(Array.isArray(transcript.segments)).toBe(true);
  });

  it('transcribes with openai/whisper-large-v3-turbo', async () => {
    const { experimental_transcribe: transcribe } = await import('ai');

    const wavBuffer = createSilentWav(16000, 1);

    const transcript = await transcribe({
      model: telnyx.transcriptionModel(
        'openai/whisper-large-v3-turbo',
      ),
      audio: wavBuffer,
      mediaType: 'audio/wav',
      abortSignal: AbortSignal.timeout(30000),
    });

    expect(transcript).toBeDefined();
    expect(typeof transcript.text).toBe('string');
  });

  it('returns segments with verbose_json format', async () => {
    const { experimental_transcribe: transcribe } = await import('ai');

    const wavBuffer = createSilentWav(16000, 1);

    const transcript = await transcribe({
      model: telnyx.transcriptionModel('distil-whisper/distil-large-v2'),
      audio: wavBuffer,
      mediaType: 'audio/wav',
      providerOptions: {
        telnyx: {
          response_format: 'verbose_json',
        },
      },
      abortSignal: AbortSignal.timeout(30000),
    });

    expect(transcript).toBeDefined();
    expect(typeof transcript.text).toBe('string');
    // With silent audio, segments may be empty — just check it doesn't throw
    expect(Array.isArray(transcript.segments)).toBe(true);
  });

  it('transcribes with provider-specific language option', async () => {
    const { experimental_transcribe: transcribe } = await import('ai');

    const wavBuffer = createSilentWav(16000, 1);

    const transcript = await transcribe({
      model: telnyx.transcriptionModel(
        'openai/whisper-large-v3-turbo',
      ),
      audio: wavBuffer,
      mediaType: 'audio/wav',
      providerOptions: {
        telnyx: {
          language: 'en',
        },
      },
      abortSignal: AbortSignal.timeout(30000),
    });

    expect(transcript).toBeDefined();
    expect(typeof transcript.text).toBe('string');
  });

  it('has correct model metadata', async () => {
    const model = telnyx.transcriptionModel(
      'distil-whisper/distil-large-v2',
    );

    expect(model.specificationVersion).toBe('v3');
    expect(model.modelId).toBe('distil-whisper/distil-large-v2');
    expect(model.provider).toBe('telnyx.transcription');
  });

  it('handles base64 encoded audio', async () => {
    const { experimental_transcribe: transcribe } = await import('ai');

    const wavBuffer = createSilentWav(16000, 1);
    const base64Audio = uint8ArrayToBase64(wavBuffer);

    const transcript = await transcribe({
      model: telnyx.transcriptionModel('distil-whisper/distil-large-v2'),
      audio: base64Audio,
      mediaType: 'audio/wav',
      abortSignal: AbortSignal.timeout(30000),
    });

    expect(transcript).toBeDefined();
    expect(typeof transcript.text).toBe('string');
  });
});

/**
 * Create a minimal WAV file buffer with silence.
 * 16-bit PCM, mono, at the given sample rate.
 */
function createSilentWav(
  sampleRate: number,
  durationSeconds: number,
): Uint8Array {
  const numSamples = sampleRate * durationSeconds;
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // silence (all zeros — DataView is already zeroed)

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
