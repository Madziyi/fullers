import 'server-only';
import { db } from '@/lib/db';
import { publicWhere } from '@/lib/catalogue';

export type TextSection = { heading: string; body: string };
export function isTextSections(value: unknown): value is TextSection[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as TextSection).heading === 'string' &&
        typeof (item as TextSection).body === 'string',
    )
  );
}

export async function getPublishedPages() {
  if (process.env.CONTENT_SOURCE === 'seed') return [];
  return db.pageContent.findMany({ where: { ...publicWhere() }, orderBy: { title: 'asc' } });
}
export async function getPublishedPage(slug: string) {
  if (process.env.CONTENT_SOURCE === 'seed') return null;
  return db.pageContent.findFirst({ where: { slug, ...publicWhere() } });
}
export async function getPublishedProjects() {
  if (process.env.CONTENT_SOURCE === 'seed') return [];
  return db.project.findMany({
    where: { ...publicWhere(), approvedAt: { not: null } },
    orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      location: true,
      projectDate: true,
      body: true,
      featured: true,
      publishedAt: true,
    },
  });
}
export async function getPublishedProject(slug: string) {
  if (process.env.CONTENT_SOURCE === 'seed') return null;
  return db.project.findFirst({
    where: { slug, ...publicWhere(), approvedAt: { not: null } },
    include: {
      images: { where: { deletedAt: null }, select: { storageKey: true, alt: true } },
      products: { where: publicWhere(), select: { name: true, slug: true } },
    },
  });
}
