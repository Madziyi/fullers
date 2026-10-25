'use client';
import { useState, useSyncExternalStore } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
const subscribe = () => () => {};
export function LoginForm() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const result = await signIn('credentials', {
        email: data.get('email'),
        password: data.get('password'),
        redirect: false,
      });
      if (result?.ok) {
        router.push('/admin');
        router.refresh();
        return;
      }
      setError('Sign-in unsuccessful. Check your details or try again later.');
    } catch {
      setError('Unable to sign in. Please try again later.');
    }
    setBusy(false);
  }
  return (
    <form method="post" action="/api/auth/callback/credentials" onSubmit={submit}>
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={72}
          required
        />
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {!hydrated && <p className="form-hint">Enable JavaScript to sign in securely.</p>}
      <button type="submit" className="button" disabled={!hydrated || busy}>
        {busy ? 'Signing in…' : 'Sign in →'}
      </button>
    </form>
  );
}
