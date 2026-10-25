'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="empty-state">
      <h1>We couldn’t load this page.</h1>
      <p>Please try again, or call +263 78 747 8592 to speak to Fullers.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
