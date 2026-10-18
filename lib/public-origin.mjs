export function publicRequestURL(path, host, configuredOrigin) {
  const base = new URL(configuredOrigin || `http://${host}`);
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.pathname !== '/' ||
    base.search ||
    base.hash
  )
    throw Error('PUBLIC_ORIGIN must be an HTTP(S) origin with no path or credentials.');
  // req.url is an HTTP path; never allow it to replace the configured host.
  const incoming = new URL(path, 'http://request.invalid');
  return new URL(incoming.pathname + incoming.search, base).href;
}
