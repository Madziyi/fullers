import { describe, expect, it } from 'vitest';
import { formatHarareDateTime, harareLocalToUtc, utcToHarareLocal } from '@/lib/scheduling-time';

describe('Zimbabwe publication time conversion', () => {
  it('interprets selected wall time in Africa/Harare and stores the UTC instant', () => {
    const instant = harareLocalToUtc('2026-10-26T09:45');
    expect(instant?.toISOString()).toBe('2026-10-26T07:45:00.000Z');
    expect(utcToHarareLocal(instant!)).toBe('2026-10-26T09:45');
    expect(formatHarareDateTime(instant!)).toContain('Africa/Harare');
  });

  it.each(['', 'tomorrow morning', '2026-02-30T09:00', '2026-10-26T24:00', '2026-10-26'])(
    'rejects malformed local date/time %s',
    (value) => expect(harareLocalToUtc(value)).toBeNull(),
  );
});
