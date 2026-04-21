/**
 * Helper for integration tests.
 * Skips tests if TELNYX_API_KEY is not set.
 */
export const API_KEY = process.env.TELNYX_API_KEY ?? '';

export function skipIfNoApiKey() {
  if (!API_KEY) {
    console.log('Skipping integration test: TELNYX_API_KEY not set');
    return true;
  }
  return false;
}
