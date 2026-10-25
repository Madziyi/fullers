import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { processDuePublications } from '@/lib/publication-worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const expected = process.env.PUBLISH_WORKER_SECRET;
  if (!expected || Buffer.byteLength(expected, 'utf8') < 32) return false;
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return false;
  const supplied = Buffer.from(authorization.slice(7), 'utf8');
  const secret = Buffer.from(expected, 'utf8');
  return supplied.length === secret.length && timingSafeEqual(supplied, secret);
}

export async function POST(request: Request) {
  if (
    !process.env.PUBLISH_WORKER_SECRET ||
    Buffer.byteLength(process.env.PUBLISH_WORKER_SECRET) < 32
  )
    return NextResponse.json(
      { error: 'Scheduled publishing worker is not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  if (!authorized(request))
    return NextResponse.json(
      { error: 'Unauthorized.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  const url = new URL(request.url);
  const limitText = url.searchParams.get('limit');
  if (
    limitText &&
    (!/^\d{1,2}$/.test(limitText) || Number(limitText) < 1 || Number(limitText) > 25)
  )
    return NextResponse.json(
      { error: 'The worker batch limit is invalid.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  try {
    const summary = await processDuePublications(new Date(), limitText ? Number(limitText) : 10);
    if (summary.published) {
      revalidatePath('/blog');
      revalidatePath('/sitemap.xml');
      revalidatePath('/');
      revalidatePath('/products');
    }
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      { error: 'The publishing worker could not complete this batch.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
