import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/admin') || pathname.startsWith('/api') || pathname.startsWith('/_next'))
    return NextResponse.next();
  const headers = new Headers(request.headers);
  headers.set('x-fullers-request-path', pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: '/:path*' };
