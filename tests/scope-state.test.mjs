import test from 'node:test';
import assert from 'node:assert/strict';
import { createScopeGate } from '../dist/scope-state.mjs';
import { demoTerms, demoRequests } from '../dist/scope-demo.mjs';
import { validatedTask } from '../lib/inference.mjs';
test('edited text invalidates even an earlier request for identical text', () => {
  const gate = createScopeGate(),
    snapshot = { id: 'a', version: 1, note: 'Fix tag' },
    ticket = gate.start(snapshot);
  assert.ok(gate.current(ticket, snapshot));
  gate.invalidate();
  assert.ok(!gate.current(ticket, snapshot));
});
test('late responses cannot overwrite newer checks, versions, or another room', () => {
  const gate = createScopeGate(),
    s = { id: 'a', version: 1, note: 'Fix tag' },
    old = gate.start(s),
    current = gate.start(s);
  assert.ok(!gate.current(old, s));
  assert.ok(gate.current(current, s));
  for (const change of [{ version: 2 }, { note: 'Add TikTok' }, { id: 'b' }])
    assert.ok(!gate.current(current, { ...s, ...change }));
});
test('every example can run through the real scope task validator', () => {
  for (const example of demoRequests)
    assert.equal(
      validatedTask({ task: 'scope', input: { terms: demoTerms, note: example.note } }).task,
      'scope',
    );
});
