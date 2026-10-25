import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { contentSecurityPolicy } from '../src/lib/security-headers';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('next-auth/react', () => ({ signIn: vi.fn() }));
import { LoginForm } from '../src/app/admin/login/form';
describe('sign-in before hydration', () => {
  it('uses POST and disables submission until the handler is ready', () => {
    const html = renderToStaticMarkup(createElement(LoginForm));
    expect(html).toContain('method="post"');
    expect(html).toContain('action="/api/auth/callback/credentials"');
    expect(html).toMatch(/<button[^>]*disabled=""/);
    expect(html).toContain('Enable JavaScript to sign in securely.');
  });
  it('allows the refresh runtime only in development', () => {
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy(false)).not.toContain("'unsafe-eval'");
    expect(contentSecurityPolicy(false)).toContain("form-action 'self'");
  });
});
