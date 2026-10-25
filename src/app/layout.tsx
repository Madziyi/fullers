import type { Metadata } from 'next';
import { siteUrl } from '@/lib/seo';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Fullers Aggregate | Concrete products in Bindura',
    template: '%s | Fullers Aggregate',
  },
  description: 'Concrete products and quarry stones from Fullers Aggregate, Bindura, Zimbabwe.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
