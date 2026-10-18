import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScopeRewrite, scopeRewritePrompt } from '../dist/domain.mjs';
import { createInferenceHandler, validatedTask } from '../lib/inference.mjs';
import { demoTerms } from '../dist/scope-demo.mjs';
const origin = 'https://example.test';
const request = (task = 'scope-rewrite', terms = demoTerms) =>
  new Request(origin + '/api/ai', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, input: { terms, note: 'Add a TikTok and paid ad rights.' } }),
  });
test('rewrites require usable text and a bounded list of removed asks', () => {
  assert.deepEqual(parseScopeRewrite('{"note":" Original Reel only. ","removed":[" TikTok "]}'), {
    note: 'Original Reel only.',
    removed: ['TikTok'],
  });
  for (const value of [
    { note: '', removed: ['x'] },
    { note: 'x', removed: [] },
    { note: 'x', removed: [42] },
    { note: 'x'.repeat(2401), removed: ['x'] },
  ])
    assert.throws(() => parseScopeRewrite(JSON.stringify(value)));
  assert.match(scopeRewritePrompt(demoTerms, 'extra TikTok'), /Do not amend the agreement/);
  assert.match(scopeRewritePrompt(demoTerms, 'extra TikTok'), /invent defects/);
});
test('rewrite endpoint validates the accepted terms and returns a real provider rewrite', async () => {
  let sent;
  const handle = createInferenceHandler({
    fetchImpl: async (_url, options) => {
      sent = JSON.parse(options.body);
      return Response.json({
        message: {
          content:
            '{"note":"Please keep to the original agreed Reel.","removed":["Extra TikTok","Paid ad rights"]}',
        },
      });
    },
  });
  const result = await handle(request(), { OLLAMA_API_KEY: 'test' }, 'rewrite');
  assert.equal(result.status, 200);
  assert.equal((await result.json()).rewrite.removed.length, 2);
  assert.ok(sent.messages[0].content.includes(demoTerms.usageRights));
  assert.throws(() => validatedTask({ task: 'scope-rewrite', input: { note: 'extra' } }));
});
test('malformed rewrite is rejected rather than replacing the original request', async () => {
  const handle = createInferenceHandler({
    fetchImpl: async () => Response.json({ message: { content: 'not a rewrite' } }),
  });
  const result = await handle(request(), { OLLAMA_API_KEY: 'test' }, 'bad-rewrite');
  assert.equal(result.status, 502);
  assert.match((await result.json()).error, /original request is unchanged/);
});
