import { describe, expect, it } from 'vitest';
import { redirectWouldCycle, resolveRedirect, safeLocalPath } from '../src/lib/admin-operations';

describe('admin redirect safety', () => {
  it('accepts only same-site pathnames', () => {
    expect(safeLocalPath('/products/bricks')).toBe('/products/bricks');
    for (const value of [
      'https://example.test/path',
      '//example.test/path',
      '/\\evil',
      '/x?y=1',
      '/x#part',
      '/%2f%2fevil',
      '/admin/users',
    ]) {
      if (value === '/admin/users') expect(safeLocalPath(value)).toBe(value);
      else expect(safeLocalPath(value)).toBeNull();
    }
  });

  it('resolves safe chains to their final destination and rejects a cycle', () => {
    const links = [
      { source: '/old', destination: '/older' },
      { source: '/older', destination: '/products' },
    ];
    expect(resolveRedirect('/old', links)).toBe('/products');
    expect(redirectWouldCycle('/products', '/old', links)).toBe(true);
    expect(redirectWouldCycle('/old', '/products', links)).toBe(false);
  });

  it('fails closed on pre-existing loops and overly deep chains', () => {
    expect(
      resolveRedirect('/a', [
        { source: '/a', destination: '/b' },
        { source: '/b', destination: '/a' },
      ]),
    ).toBeNull();
    const deep = Array.from({ length: 21 }, (_, i) => ({
      source: `/p${i}`,
      destination: `/p${i + 1}`,
    }));
    expect(resolveRedirect('/p0', deep)).toBeNull();
  });
});
