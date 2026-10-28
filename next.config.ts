import type { NextConfig } from 'next';
import { contentSecurityPolicy } from './src/lib/security-headers';
const config: NextConfig = {
  poweredByHeader: false,
  logging: { incomingRequests: { ignore: [/\/admin\/login\?.*(?:email|password)=/i] } },
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  turbopack: { root: process.cwd() },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...(process.env.SITE_INDEXING_ENABLED === 'false'
            ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
            : []),
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy(process.env.NODE_ENV === 'development'),
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};
export default config;
