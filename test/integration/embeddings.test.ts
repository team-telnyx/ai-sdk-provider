import { describe, it, expect } from 'vitest';
import { embed, embedMany } from 'ai';
import { createTelnyx } from '../../src/telnyx-provider';
import { API_KEY } from '../utils';

describe.skipIf(!API_KEY)('Embeddings Integration', () => {
  const telnyx = createTelnyx({ apiKey: API_KEY });

  it('generates embedding for a single value', async () => {
    const { embedding } = await embed({
      model: telnyx.embeddingModel('thenlper/gte-large'),
      value: 'What is WebRTC?',
    });

    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1024); // gte-large dimension
  }, 30000);

  it('generates embeddings for multiple values', async () => {
    const { embeddings } = await embedMany({
      model: telnyx.embeddingModel('thenlper/gte-large'),
      values: ['Hello world', 'WebRTC is cool'],
    });

    expect(embeddings).toBeDefined();
    expect(embeddings.length).toBe(2);
    expect(embeddings[0].length).toBe(1024);
    expect(embeddings[1].length).toBe(1024);
  }, 30000);
});
