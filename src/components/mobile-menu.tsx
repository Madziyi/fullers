'use client';
import Link from 'next/link';
export function MobileMenu({ items }: { items: { label: string; href: string }[] }) {
  return (
    <details
      className="mobile-menu"
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('a'))
          event.currentTarget.open = false;
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.currentTarget.open = false;
          event.currentTarget.querySelector('summary')?.focus();
        }
      }}
    >
      <summary aria-label="Open navigation">
        <span>Menu</span>
        <span aria-hidden="true">☰</span>
      </summary>
      <nav aria-label="Mobile navigation">
        {items.map((item) => (
          <Link href={item.href} key={item.label}>
            {item.label}
          </Link>
        ))}
        <Link href="/contact">Request a quote ↗</Link>
      </nav>
    </details>
  );
}
