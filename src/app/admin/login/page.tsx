import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from './form';
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  if ('password' in query || 'email' in query) redirect('/admin/login');
  return (
    <main id="main" className="admin-login">
      <div className="login-story">
        <p className="eyebrow">FULLERS / CONTENT STUDIO</p>
        <h1>
          Good stories.
          <br />
          Solid foundations.
        </h1>
        <p>
          A considered space to look after your website.
          <br />
          Built for the people behind Fullers.
        </p>
      </div>
      <div className="login-form-wrap">
        <div className="login-form">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to Fullers.</h2>
          <p>Use your administrator or editor account.</p>
          <LoginForm />
          <Link className="admin-back" href="/">
            ← Back to the public website
          </Link>
        </div>
      </div>
    </main>
  );
}
