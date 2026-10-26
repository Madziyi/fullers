import 'server-only';
import { z } from 'zod';
import { db } from './db';
import { publicWhere } from './catalogue';

const paragraph = z.object({ type: z.literal('paragraph'), text: z.string().max(10000) });
const heading = z.object({ type: z.enum(['heading2', 'heading3']), text: z.string().max(300) });
const quote = z.object({ type: z.literal('quote'), text: z.string().max(2000) });
const list = z.object({ type: z.literal('list'), items: z.array(z.string().max(500)).max(30) });
const code = z.object({ type: z.literal('code'), text: z.string().max(10000) });
const faq = z.object({
  type: z.literal('faq'),
  question: z.string().max(300),
  answer: z.string().max(3000),
});
const table = z
  .object({
    type: z.literal('table'),
    headers: z.array(z.string().max(300)).min(1).max(8),
    rows: z.array(z.array(z.string().max(1000)).min(1).max(8)).max(40),
  })
  .refine(
    (value) => value.rows.every((row) => row.length === value.headers.length),
    'Each row must match the column headings.',
  );
const safeHref = (value: string) =>
  /^\/(?![\\/])[a-zA-Z0-9._~!$&'()*+,;=:@%/-]*(?:[?#][a-zA-Z0-9._~!$&'()*+,;=:@%/?-]*)?$/.test(
    value,
  ) ||
  (() => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  })();
const link = z.object({
  type: z.literal('link'),
  text: z.string().max(300),
  href: z.string().max(1000).refine(safeHref),
});
const approvedAssetPaths = [
  '/assets/quarry-stones.webp',
  '/assets/bricks.webp',
  '/assets/half-moons.webp',
  '/assets/interlocking-pavers.webp',
  '/assets/delivery-equipment.webp',
] as const;
export const safeImageSrc = (value: string) =>
  approvedAssetPaths.includes(value as (typeof approvedAssetPaths)[number]) ||
  /^\/api\/article-media\/[0-9a-f-]{36}$/.test(value);
const image = z.object({
  type: z.literal('image'),
  src: z.string().max(300).refine(safeImageSrc),
  alt: z.string().max(300),
  caption: z.string().max(500),
});
export const articleBodySchema = z.object({
  type: z.literal('doc'),
  blocks: z
    .array(
      z.discriminatedUnion('type', [
        paragraph,
        heading,
        quote,
        list,
        link,
        image,
        code,
        faq,
        table,
      ]),
    )
    .max(200),
});
const publishedBodySchema = articleBodySchema.superRefine((doc, ctx) =>
  doc.blocks.forEach((block, index) => {
    if (block.type === 'image' && block.alt.trim().length < 5)
      ctx.addIssue({
        code: 'custom',
        path: ['blocks', index, 'alt'],
        message: 'Informative images need descriptive alt text.',
      });
    if (block.type === 'link' && !block.text.trim())
      ctx.addIssue({
        code: 'custom',
        path: ['blocks', index, 'text'],
        message: 'Links need descriptive text.',
      });
    if (block.type === 'faq' && (!block.question.trim() || !block.answer.trim()))
      ctx.addIssue({
        code: 'custom',
        path: ['blocks', index],
        message: 'Complete the question and answer.',
      });
    if (block.type === 'table' && block.headers.some((value) => !value.trim()))
      ctx.addIssue({
        code: 'custom',
        path: ['blocks', index],
        message: 'Each table column needs a heading.',
      });
  }),
);
export type ArticleBody = z.infer<typeof articleBodySchema>;
export type ArticleSnapshot = {
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  categoryName: string | null;
  tagNames: string[];
  body: ArticleBody;
  coverSrc: string | null;
  coverAlt: string;
  seoTitle: string;
  seoDescription: string;
  productSlugs: string[];
  publishedAt: string;
  canonical?: string;
  socialTitle?: string;
  socialImage?: string | null;
};
export const articleSnapshotSchema = z.object({
  title: z.string().min(5).max(160),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  excerpt: z.string().min(20).max(500),
  authorName: z.string().min(1).max(120),
  categoryName: z.string().max(120).nullable(),
  tagNames: z.array(z.string().max(80)).max(30),
  body: publishedBodySchema,
  coverSrc: z.string().max(300).refine(safeImageSrc).nullable(),
  coverAlt: z.string().max(300),
  seoTitle: z.string().min(1).max(180),
  seoDescription: z.string().min(1).max(320),
  productSlugs: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).max(20),
  publishedAt: z.string().datetime(),
  canonical: z
    .string()
    .url()
    .refine((value) => /^https?:\/\//.test(value))
    .optional(),
  socialTitle: z.string().max(180).optional(),
  socialImage: z.string().max(300).refine(safeImageSrc).nullable().optional(),
});

export async function getPublishedArticles() {
  if (process.env.CONTENT_SOURCE === 'seed') return [];
  const posts = await db.post.findMany({
    where: { ...publicWhere(), publishedRevisionId: { not: null }, publishedSlug: { not: null } },
    select: { id: true, publishedRevisionId: true, publishedSlug: true },
  });
  const revisions = await db.postRevision.findMany({
    where: {
      id: { in: posts.map((post) => post.publishedRevisionId!).filter(Boolean) },
      postId: { in: posts.map((post) => post.id) },
    },
    select: { id: true, postId: true, snapshot: true },
  });
  const articles = posts
    .flatMap((post) => {
      const revision = revisions.find(
        (item) => item.id === post.publishedRevisionId && item.postId === post.id,
      );
      if (!revision || !post.publishedSlug) return [];
      const parsed = articleSnapshotSchema.safeParse(revision.snapshot);
      return parsed.success
        ? [{ ...parsed.data, slug: post.publishedSlug } as ArticleSnapshot]
        : [];
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const linkedSlugs = [...new Set(articles.flatMap((article) => article.productSlugs))];
  const liveProducts = await db.product.findMany({
    where: { ...publicWhere(), slug: { in: linkedSlugs } },
    select: { slug: true },
  });
  const liveSlugs = new Set(liveProducts.map((product) => product.slug));
  return articles.map((article) => ({
    ...article,
    productSlugs: article.productSlugs.filter((slug) => liveSlugs.has(slug)),
  }));
}

export async function getPublishedArticle(slug: string) {
  return (await getPublishedArticles()).find((article) => article.slug === slug) ?? null;
}
