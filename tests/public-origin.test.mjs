import test from 'node:test';
import assert from 'node:assert/strict';
import { publicRequestURL } from '../lib/public-origin.mjs';
import { createInferenceHandler } from '../lib/inference.mjs';
test('TLS proxy canonical origin matches HTTPS browser origin without trusting forwarded headers', async () => {
  const url = publicRequestURL('/api/ai', 'internal:4173', 'https://public.example');
  const handle = createInferenceHandler();
  const result = await handle(
    new Request(url, {
      method: 'POST',
      headers: { Origin: 'https://public.example', 'Content-Type': 'application/json' },
      body: '{"task":"unsupported"}',
    }),
    { OLLAMA_API_KEY: 'test' },
  );
  assert.equal(result.status, 400);
  assert.match((await result.json()).error, /not supported/);
  assert.equal(publicRequestURL('/api/ai', 'localhost:4173'), 'http://localhost:4173/api/ai');
  assert.equal(
    publicRequestURL('https://other.example/api/ai', 'local', 'https://public.example'),
    'https://public.example/api/ai',
  );
  assert.throws(() => publicRequestURL('/api/ai', 'local', 'https://public.example/subpath'));
});
