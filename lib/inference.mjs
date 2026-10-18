import {
  briefPrompt,
  parseBrief,
  reviewPrompt,
  scopePrompt,
  parseScope,
  scopeRewritePrompt,
  parseScopeRewrite,
} from '../dist/domain.mjs';
export const DEFAULT_HOSTED_MODEL = 'gemma4:31b';
const allowedModels = new Set([
  DEFAULT_HOSTED_MODEL,
  'gemma4:26b',
  'gemma4:e2b',
  'gemma4:e4b',
  'gemma3:1b',
  'gemma3:4b',
  'gemma3:12b',
  'gemma3:27b',
  'gemma2:2b',
]);
const response = (status, value) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
const failure = (message, status = 400) => Object.assign(new Error(message), { status });
async function readJSON(request) {
  const reader = request.body?.getReader();
  if (!reader) throw failure('Enter the campaign details first.');
  let size = 0;
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 18000) {
      await reader.cancel();
      throw failure('Keep campaign details under 18 KB.', 413);
    }
    chunks.push(value);
  }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const part of chunks) {
    data.set(part, offset);
    offset += part.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(data));
  } catch {
    throw failure('The campaign request is not valid JSON.');
  }
}
export function validatedTask(body) {
  if (!body || typeof body !== 'object') throw failure('Choose an AI task.');
  if (body.task === 'brief') {
    const input = {};
    for (const name of [
      'business',
      'city',
      'idea',
      'reward',
      'deadline',
      'platform',
      'category',
      'rewardType',
    ]) {
      const value = body.input?.[name];
      if (typeof value !== 'string' || value.length > (name === 'idea' ? 1800 : 200))
        throw failure('Check your campaign details and try again.');
      input[name] = value.trim();
    }
    if (['business', 'idea', 'reward', 'deadline'].some(name => !input[name]))
      throw failure('Include the business, idea, reward, and deadline.');
    return { task: 'brief', prompt: briefPrompt(input) };
  }
  if (body.task === 'review') {
    const deliverables = body.input?.deliverables,
      caption = body.input?.caption;
    if (
      !Array.isArray(deliverables) ||
      !deliverables.length ||
      deliverables.length > 20 ||
      !deliverables.every(x => typeof x === 'string' && x.length <= 2400) ||
      deliverables.join('').length > 5000 ||
      typeof caption !== 'string' ||
      !caption.trim() ||
      caption.length > 4000
    )
      throw failure('Include the agreed deliverables and a caption under 4,000 characters.');
    return { task: 'review', prompt: reviewPrompt({ deliverables }, caption) };
  }
  if (body.task === 'scope' || body.task === 'scope-rewrite') {
    const terms = body.input?.terms,
      note = body.input?.note;
    if (
      !terms ||
      typeof terms !== 'object' ||
      !['deliverables', 'reward', 'deadline', 'usageRights'].every(
        name => typeof terms[name] === 'string' && terms[name].length <= 2400,
      ) ||
      !terms.deliverables.trim() ||
      !Number.isInteger(terms.revisions) ||
      terms.revisions < 0 ||
      terms.revisions > 10 ||
      typeof note !== 'string' ||
      !note.trim() ||
      note.length > 2400
    )
      throw failure(
        'Include the accepted agreement and a revision request under 2,400 characters.',
      );
    return {
      task: body.task,
      prompt:
        body.task === 'scope'
          ? scopePrompt(terms, note.trim())
          : scopeRewritePrompt(terms, note.trim()),
    };
  }
  throw failure('This AI task is not supported.');
}
export function createInferenceHandler({
  fetchImpl = fetch,
  now = () => Date.now(),
  onTrace = () => {},
} = {}) {
  const limits = new Map();
  let concurrent = 0;
  return async function handle(request, env = {}, clientIP = 'anonymous') {
    const model = allowedModels.has(env.OLLAMA_MODEL) ? env.OLLAMA_MODEL : DEFAULT_HOSTED_MODEL;
    const key = env.OLLAMA_API_KEY;
    let base;
    try {
      base = new URL(env.OLLAMA_BASE_URL || 'https://ollama.com');
    } catch {
      return response(503, { error: 'The Ollama server address needs attention.' });
    }
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
    if (
      (base.protocol !== 'https:' && !(local && env.NODE_ENV !== 'production')) ||
      base.username ||
      base.password
    )
      return response(503, { error: 'Use a secure Ollama endpoint.' });
    const provider = base.hostname === 'ollama.com' ? 'Ollama Cloud' : 'Ollama server';
    const configured = Boolean(
      key || (local && env.OLLAMA_BASE_URL && env.NODE_ENV !== 'production'),
    );
    const path = new URL(request.url).pathname;
    if (path.endsWith('/status') && request.method === 'GET')
      return response(200, { configured, mode: 'hosted', provider, model, downloads: false });
    if (request.method !== 'POST') return response(405, { error: 'Use POST for an AI request.' });
    let origin;
    try {
      origin = new URL(request.headers.get('Origin'));
    } catch {
      return response(403, { error: 'Use AI from the LocalPerks website.' });
    }
    if (origin.origin !== new URL(request.url).origin)
      return response(403, { error: 'Use AI from the LocalPerks website.' });
    if (!request.headers.get('Content-Type')?.startsWith('application/json'))
      return response(415, { error: 'Use a JSON campaign request.' });
    if (!configured)
      return response(503, {
        error:
          'Hosted AI is being connected. The editable template and collaboration workspace are available.',
      });
    try {
      const task = validatedTask(await readJSON(request));
      const timestamp = now();
      for (const [id, value] of limits) if (value.until <= timestamp) limits.delete(id);
      const userKey = 'ip:' + clientIP,
        person = limits.get(userKey) || { count: 0, until: timestamp + 3600000 },
        global = limits.get('global') || { count: 0, until: timestamp + 3600000 };
      if (person.count >= 10 || global.count >= 60 || concurrent >= 3)
        return response(429, {
          error:
            'The demo AI limit has been reached. Try again later; your collaboration is saved.',
        });
      person.count++;
      global.count++;
      limits.set(userKey, person);
      limits.set('global', global);
      concurrent++;
      const trace = {
        event: 'localperks.inference',
        id: crypto.randomUUID(),
        task: task.task,
        model,
        provider,
        outcome: 'error',
      };
      const started = performance.now();
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (key) headers.Authorization = `Bearer ${key}`;
        const upstream = await fetchImpl(
          new URL('api/chat', base.href.endsWith('/') ? base.href : base.href + '/').href,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: task.prompt }],
              stream: false,
              think: false,
              options: { temperature: 0.25, num_predict: 1200 },
            }),
            signal: AbortSignal.timeout(45000),
          },
        );
        trace.providerStatus = upstream.status;
        if (!upstream.ok) {
          if (upstream.status === 429)
            throw failure(
              'The Ollama account’s usage limit was reached. Please try again later.',
              429,
            );
          if ([401, 403].includes(upstream.status))
            throw failure(
              'The hosted AI connection needs attention. You can continue with the editable template.',
              503,
            );
          throw failure('The hosted AI service is temporarily unavailable. Please try again.', 502);
        }
        const result = await upstream.json();
        trace.promptTokens = Number.isFinite(result.prompt_eval_count)
          ? result.prompt_eval_count
          : null;
        trace.outputTokens = Number.isFinite(result.eval_count) ? result.eval_count : null;
        const text =
          typeof result.message?.content === 'string' ? result.message.content.trim() : '';
        if (!text)
          throw failure('The AI returned no usable content. Try rephrasing your request.', 502);
        if (task.task === 'brief') {
          let brief;
          try {
            brief = parseBrief(text);
          } catch {
            throw failure(
              'The AI brief was incomplete. Try again or use the editable template.',
              502,
            );
          }
          trace.outcome = 'success';
          return response(200, { brief, model, provider });
        }
        if (task.task === 'scope-rewrite') {
          let rewrite;
          try {
            rewrite = parseScopeRewrite(text);
          } catch {
            throw failure(
              'Gemma could not produce a usable rewrite. Your original request is unchanged; try again.',
              502,
            );
          }
          trace.outcome = 'success';
          return response(200, { rewrite, model, provider });
        }
        if (task.task === 'scope') {
          let scope;
          try {
            scope = parseScope(text);
          } catch {
            throw failure(
              'The scope check was incomplete. Try again or compare the request with the agreement yourself.',
              502,
            );
          }
          trace.outcome = 'success';
          return response(200, { scope, model, provider });
        }
        trace.outcome = 'success';
        return response(200, { text: text.slice(0, 10000), model, provider });
      } finally {
        concurrent--;
        try {
          onTrace({ ...trace, durationMs: Math.round(performance.now() - started) });
        } catch {}
      }
    } catch (err) {
      return response(err.name === 'TimeoutError' ? 504 : err.status || 502, {
        error:
          err.name === 'TimeoutError'
            ? 'AI took too long. Try again; your campaign details are still here.'
            : err.status
              ? err.message
              : 'The AI request could not be completed. Please try again.',
      });
    }
  };
}
