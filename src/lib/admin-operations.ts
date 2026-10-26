import 'server-only';

export function safeLocalPath(value: string): string | null {
  const path = value.trim();
  if (
    path.length < 2 ||
    path.length > 500 ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    /[\\\u0000-\u001f\u007f?#]/.test(path) ||
    /%(?:2f|5c|00)/i.test(path)
  )
    return null;
  try {
    const url = new URL(path, 'https://fullers.invalid');
    if (url.origin !== 'https://fullers.invalid' || url.pathname !== path) return null;
  } catch {
    return null;
  }
  return path;
}

export function resolveRedirect(
  path: string,
  entries: Array<{ source: string; destination: string }>,
) {
  const first = safeLocalPath(path);
  if (!first) return null;
  const map = new Map(entries.map((entry) => [entry.source, entry.destination]));
  const seen = new Set<string>();
  let current = first;
  for (let depth = 0; depth < 20; depth += 1) {
    if (seen.has(current)) return null;
    seen.add(current);
    const next = map.get(current);
    if (!next) return current;
    const safe = safeLocalPath(next);
    if (!safe) return null;
    current = safe;
  }
  return map.has(current) ? null : current;
}

export function redirectWouldCycle(
  source: string,
  destination: string,
  existing: Array<{ source: string; destination: string }>,
) {
  const trial = [...existing.filter((item) => item.source !== source), { source, destination }];
  return resolveRedirect(source, trial) === null;
}
