export const SWIPE_DISTANCE = 110;
const FLICK_VELOCITY = 600;
const FLICK_MIN_DISTANCE = 40;

// A swipe commits on distance, or on a fast flick that has moved a little.
export function swipeDecision(offsetX, velocityX) {
  if (offsetX > SWIPE_DISTANCE || (velocityX > FLICK_VELOCITY && offsetX > FLICK_MIN_DISTANCE)) return 'like';
  if (offsetX < -SWIPE_DISTANCE || (velocityX < -FLICK_VELOCITY && offsetX < -FLICK_MIN_DISTANCE)) return 'skip';
  return null;
}
