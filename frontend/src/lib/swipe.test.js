import { describe, expect, it } from 'vitest';
import { SWIPE_DISTANCE, swipeDecision } from './swipe';

describe('swipeDecision', () => {
  it('commits past the distance threshold in either direction', () => {
    expect(swipeDecision(SWIPE_DISTANCE + 1, 0)).toBe('like');
    expect(swipeDecision(-SWIPE_DISTANCE - 1, 0)).toBe('skip');
  });

  it('snaps back for short, slow drags', () => {
    expect(swipeDecision(SWIPE_DISTANCE, 0)).toBeNull();
    expect(swipeDecision(60, 200)).toBeNull();
  });

  it('accepts a fast flick that has moved a little', () => {
    expect(swipeDecision(50, 900)).toBe('like');
    expect(swipeDecision(-50, -900)).toBe('skip');
  });

  it('ignores a fast flick that has barely moved or points the other way', () => {
    expect(swipeDecision(10, 900)).toBeNull();
    expect(swipeDecision(50, -900)).toBeNull();
  });
});
