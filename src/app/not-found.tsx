import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="empty-state">
      <p className="eyebrow">404 / A DIFFERENT DIRECTION</p>
      <h1>
        Let’s get back
        <br />
        on solid ground.
      </h1>
      <p>We couldn’t find that page.</p>
      <Link href="/" className="button">
        Return to Fullers →
      </Link>
    </main>
  );
}
