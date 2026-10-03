import { describe, expect, it } from 'vitest';
import { initials, isVideo, timeAgo } from './format';

describe('timeAgo', () => {
  const now = new Date('2026-10-03T12:00:00Z').getTime();
  const ago = (ms) => new Date(now - ms).toISOString();

  it('buckets into now, minutes, hours and days', () => {
    expect(timeAgo(ago(20_000), now)).toBe('now');
    expect(timeAgo(ago(5 * 60_000), now)).toBe('5m');
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe('3h');
    expect(timeAgo(ago(2 * 86_400_000), now)).toBe('2d');
  });

  it('falls back to a date after a week, and to now for bad input', () => {
    expect(timeAgo(ago(10 * 86_400_000), now)).not.toMatch(/^\d+d$/);
    expect(timeAgo(undefined, now)).toBe('now');
    expect(timeAgo('not a date', now)).toBe('now');
  });
});

describe('initials', () => {
  it('uses first and last name', () => {
    expect(initials('Riya Menon')).toBe('RM');
    expect(initials('Kavya Lakshmi Rao')).toBe('KR');
    expect(initials('arjun')).toBe('A');
    expect(initials('  ')).toBe('?');
  });
});

describe('isVideo', () => {
  it('matches the subtypes the API stores, including quicktime for .mov', () => {
    expect(isVideo({ fileType: 'mp4' })).toBe(true);
    expect(isVideo({ fileType: 'quicktime' })).toBe(true);
    expect(isVideo({ fileType: 'jpeg' })).toBe(false);
    expect(isVideo({})).toBe(false);
  });
});
