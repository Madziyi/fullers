import { Header, Footer } from '@/components/chrome';
import { getSettings } from '@/lib/content';
import { getPublishedArticles } from '@/lib/articles';
import { getPublishedProjects } from '@/lib/pages-projects';
import { getResolvedRedirect } from '@/lib/redirects';
import { headers } from 'next/headers';
import { permanentRedirect, redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-fullers-request-path');
  if (pathname) {
    const resolved = await getResolvedRedirect(pathname);
    if (resolved?.permanent) permanentRedirect(resolved.destination);
    if (resolved) redirect(resolved.destination);
  }
  const [settings, articles, projects] = await Promise.all([
    getSettings(),
    getPublishedArticles(),
    getPublishedProjects(),
  ]);
  return (
    <>
      <Header
        settings={settings}
        showBlog={articles.length > 0}
        showProjects={projects.length > 0}
      />
      {children}
      <Footer settings={settings} />
    </>
  );
}
