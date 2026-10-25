import { describe, expect, it } from 'vitest';
import { articleBodySchema, articleSnapshotSchema } from '@/lib/articles';

describe('structured article content', () => {
  it('accepts supported semantic blocks and approved media references', () => {
    const result = articleBodySchema.safeParse({
      type: 'doc',
      blocks: [
        { type: 'paragraph', text: 'A useful introduction.' },
        { type: 'heading2', text: 'Plan the work' },
        { type: 'list', items: ['Ask about quantities', 'Confirm specifications'] },
        { type: 'quote', text: 'A short quotation' },
        { type: 'link', text: 'Explore bricks', href: '/products/bricks' },
        {
          type: 'image',
          src: '/assets/bricks.webp',
          alt: 'Stacks of bricks at Fullers',
          caption: 'Bricks at the yard',
        },
        {
          type: 'image',
          src: '/api/article-media/123e4567-e89b-12d3-a456-426614174000',
          alt: 'A detail of an uploaded image',
          caption: '',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it.each([
    { type: 'script', text: 'alert(1)' },
    { type: 'link', text: 'unsafe', href: 'javascript:alert(1)' },
    { type: 'link', text: 'protocol relative', href: '//evil.example/path' },
    { type: 'link', text: 'backslash escape', href: '/\\evil.example' },
    { type: 'image', src: '/assets/../../private', alt: 'unsafe path', caption: '' },
    { type: 'embed', html: '<iframe src="https://example.test"></iframe>' },
  ])('rejects unsafe or unsupported content block %#', (block) => {
    expect(articleBodySchema.safeParse({ type: 'doc', blocks: [block] }).success).toBe(false);
  });

  it('rejects malformed documents and oversized block collections', () => {
    const parsed = articleBodySchema.safeParse({
      type: 'doc',
      blocks: [],
      html: '<b>raw HTML</b>',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect('html' in parsed.data).toBe(false);
    expect(articleBodySchema.safeParse({ type: 'document', blocks: [] }).success).toBe(false);
    expect(
      articleBodySchema.safeParse({
        type: 'doc',
        blocks: Array.from({ length: 201 }, () => ({ type: 'paragraph', text: 'x' })),
      }).success,
    ).toBe(false);
  });

  it('rejects publication snapshots without useful image text and complete metadata',()=>{
    const snapshot={title:'Choosing products for a building project',slug:'choosing-products',excerpt:'A useful introduction to choosing concrete products for a project.',authorName:'Fullers Aggregate',categoryName:null,tagNames:[],body:{type:'doc',blocks:[{type:'image',src:'/assets/bricks.webp',alt:'',caption:''}]},coverSrc:null,coverAlt:'',seoTitle:'Choosing products',seoDescription:'A description for people planning a building project in Bindura.',productSlugs:[],publishedAt:new Date().toISOString()};
    expect(articleSnapshotSchema.safeParse(snapshot).success).toBe(false);
    expect(articleSnapshotSchema.safeParse({...snapshot,body:{type:'doc',blocks:[]}}).success).toBe(true);
  });
});
