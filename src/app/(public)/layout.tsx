import { Header, Footer } from '@/components/chrome';
import { getSettings } from '@/lib/content';
import { getPublishedArticles } from '@/lib/articles';
export const dynamic = 'force-dynamic';
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, articles] = await Promise.all([getSettings(), getPublishedArticles()]);
  return (
    <>
      <Header settings={settings} showBlog={articles.length > 0} />
      {children}
      <Footer settings={settings} />
    </>
  );
}
