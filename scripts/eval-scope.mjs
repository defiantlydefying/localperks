// Bounded evaluation against real Ollama inference. No customer data or secrets in reports.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { scopePrompt, parseScope } from '../dist/domain.mjs';
import { cases, terms } from '../eval/scope-cases.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
try {
  process.loadEnvFile(resolve(root, '.env'));
} catch {}
const model = process.env.OLLAMA_MODEL || 'gemma4:31b';
const base = new URL(process.env.OLLAMA_BASE_URL || 'https://ollama.com');
if (base.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(base.hostname))
  throw Error('Use HTTPS for remote inference.');
if (base.hostname === 'ollama.com' && !process.env.OLLAMA_API_KEY)
  throw Error('Set OLLAMA_API_KEY in the local .env.');
const results = [];
for (const item of cases) {
  const start = performance.now();
  let row = { ...item };
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.OLLAMA_API_KEY) headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;
    const response = await fetch(new URL('/api/chat', base), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: scopePrompt(terms, item.note) }],
        stream: false,
        think: false,
        options: { temperature: 0.25, num_predict: 1200 },
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      row.error = `Provider HTTP ${response.status}`;
      if ([401, 403, 429].includes(response.status)) {
        results.push({ ...row, latencyMs: Math.round(performance.now() - start) });
        break;
      }
      throw Error(row.error);
    }
    const value = await response.json(),
      scope = parseScope(value.message?.content || '');
    row = {
      ...row,
      actual: scope.verdict,
      correct: scope.verdict === item.expected,
      scope,
      promptTokens: value.prompt_eval_count ?? null,
      outputTokens: value.eval_count ?? null,
    };
  } catch (err) {
    row.error =
      err.name === 'TimeoutError'
        ? 'Inference timed out'
        : row.error || 'Inference or output parsing failed';
  }
  row.latencyMs = Math.round(performance.now() - start);
  results.push(row);
  console.log(`${item.id}: ${row.actual || row.error} (${row.latencyMs} ms)`);
}
const successful = results.filter(r => r.actual),
  times = successful.map(r => r.latencyMs).sort((a, b) => a - b),
  correct = successful.filter(r => r.correct).length;
const report = {
  runAt: new Date().toISOString(),
  model,
  provider: base.hostname,
  totalCases: cases.length,
  attempted: results.length,
  successful: successful.length,
  correct,
  errors: results.filter(r => r.error).length,
  accuracy: successful.length ? correct / successful.length : null,
  medianLatencyMs: times.length
    ? (times[Math.floor((times.length - 1) / 2)] + times[Math.floor(times.length / 2)]) / 2
    : null,
  costUSD: null,
  limitations:
    'One run on hand-labeled synthetic cases, not a representative benchmark or a legal judgment. Ambiguous labels are subjective. No cost claim: provider billing was not measured. HTTP quota/auth errors stop the run without purchasing or switching providers.',
  agreement: terms,
  results,
};
await mkdir(resolve(root, 'eval'), { recursive: true });
await writeFile(resolve(root, 'eval/scope-results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({
    attempted: report.attempted,
    correct,
    successful: report.successful,
    errors: report.errors,
    medianLatencyMs: report.medianLatencyMs,
  }),
);
