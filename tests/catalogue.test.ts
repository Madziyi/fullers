import { describe, it, expect } from 'vitest';
import { initialProducts, initialSettings, isPublic, whatsappUrl } from '../src/lib/catalogue';
import { settingsSchema } from '../src/lib/validation';
import { jsonLd } from '../src/lib/seo';
describe('source content contract', () => {
  it('contains exactly seven unique, specification-free products with only matching assets', () => {
    expect(initialProducts).toHaveLength(7);
    expect(new Set(initialProducts.map((p) => p.slug)).size).toBe(7);
    expect(initialProducts.filter((p) => !p.image).map((p) => p.name)).toEqual([
      'Manhole Rings',
      'Culverts',
      'Durawall',
    ]);
    for (const p of initialProducts) {
      expect(p.specifications).toEqual([]);
      if (p.image) {
        expect(p.image).toBe(`/assets/${p.slug}.webp`);
        expect(p.imageAlt.length).toBeGreaterThan(10);
      }
    }
  });
  it('retains approved editorial proof', () => {
    expect([
      initialSettings.experienceValue,
      initialSettings.jobsValue,
      initialSettings.satisfactionValue,
    ]).toEqual(['30+', '700+', '100%']);
    expect(initialSettings.awardClaim).toBe('Award-winning manufacturer');
  });
  it('formats the supplied number using E.164 digits and encodes enquiry text', () => {
    expect(whatsappUrl(initialSettings.phone)).toMatch(/^https:\/\/wa.me\/263787478592\?text=/);
    expect(decodeURIComponent(whatsappUrl(initialSettings.phone, 'Bricks & pavers'))).toContain(
      'Bricks & pavers',
    );
    expect(() => whatsappUrl('123')).toThrow();
  });
  it('never exposes drafts, scheduled, archived, deleted or future-dated records', () => {
    const publishedAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-10-24T00:00:00Z');
    const base = { status: 'PUBLISHED', publishedAt, deletedAt: null };
    expect(isPublic(base, now)).toBe(true);
    for (const status of ['DRAFT', 'SCHEDULED', 'ARCHIVED'])
      expect(isPublic({ ...base, status }, now)).toBe(false);
    expect(isPublic({ ...base, publishedAt: new Date('2027-01-01') }, now)).toBe(false);
    expect(isPublic({ ...base, publishedAt: null }, now)).toBe(false);
    expect(isPublic({ ...base, deletedAt: now }, now)).toBe(false);
  });
  it('validates settings and bounds user input', () => {
    expect(settingsSchema.safeParse(initialSettings).success).toBe(true);
    expect(
      settingsSchema.safeParse({ ...initialSettings, phone: 'javascript:alert(1)' }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({ ...initialSettings, experienceValue: 'x'.repeat(17) }).success,
    ).toBe(false);
    expect(settingsSchema.safeParse({ ...initialSettings, seoDescription: '' }).success).toBe(
      false,
    );
  });
  it('prevents JSON-LD script breakout', () => {
    const result = jsonLd({ title: '</script><script>alert(1)</script>' });
    expect(result).not.toContain('<');
    expect(JSON.parse(result).title).toContain('</script>');
  });
});
