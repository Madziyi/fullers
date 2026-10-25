import { Header, Footer } from '@/components/chrome';
import { getSettings } from '@/lib/content';
export const dynamic = 'force-dynamic';
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <Header settings={settings} />
      {children}
      <Footer settings={settings} />
    </>
  );
}
