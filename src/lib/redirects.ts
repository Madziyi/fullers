import 'server-only';
import { db } from './db';
import { safeLocalPath } from './admin-operations';

export async function getResolvedRedirect(pathname: string) {
  if (process.env.CONTENT_SOURCE === 'seed') return null;
  const source = safeLocalPath(pathname);
  if (!source || source.startsWith('/admin') || source.startsWith('/api')) return null;
  const first = await db.redirect.findUnique({
    where: { source },
    select: { permanent: true, destination: true },
  });
  if (!first) return null;
  let destination = first.destination;
  const seen = new Set([source]);
  for (let depth = 0; depth < 20; depth += 1) {
    const safe = safeLocalPath(destination);
    if (!safe || seen.has(safe)) return null;
    seen.add(safe);
    const next = await db.redirect.findUnique({
      where: { source: safe },
      select: { destination: true },
    });
    if (!next) return { destination: safe, permanent: first.permanent };
    destination = next.destination;
  }
  return null;
}
