import { useEffect, useImperativeHandle, useRef } from 'react';
import { animate, motion, useDragControls, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { swipeDecision } from '@/lib/swipe';
import { cn } from '@/lib/utils';

// Cards stay opaque: translucent cards would show the stack through each other.
const DEPTH = [
  { scale: 1, y: 0 },
  { scale: 0.95, y: 22 },
  { scale: 0.9, y: 44 },
];
const SETTLE = { type: 'spring', stiffness: 320, damping: 30 };

// Card stack with drag-to-swipe. Drag is never the only way in: the Skip and
// Like buttons (and ← / → when `keyboard` is set) do the same thing.
export default function SwipeDeck({ items, index, onSwipe, renderCard, keyboard = false, label, className, stageClassName }) {
  const topRef = useRef(null);
  const visible = items.slice(index, index + DEPTH.length);
  const fly = (dir) => topRef.current?.fly(dir);

  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); topRef.current?.fly('like'); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); topRef.current?.fly('skip'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyboard]);

  return (
    // gap-12 leaves room for the cards stacked below the top one.
    <div className={cn('flex w-full flex-col items-center gap-12', className)}>
      <div role="region" aria-label={label} aria-roledescription="card stack" className={cn('relative w-full', stageClassName)}>
        {visible
          .map((item, depth) => (
            <DeckCard key={item._id} ref={depth === 0 ? topRef : undefined} item={item} depth={depth} onSwipe={onSwipe}>
              {renderCard(item, depth === 0)}
            </DeckCard>
          ))
          .reverse()}
      </div>
      <div className="flex items-center gap-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-lg" aria-label="Skip" disabled={!visible.length} onClick={() => fly('skip')} className="bg-card">
              <X />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Skip{keyboard && ' (←)'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="brand" size="icon-lg" aria-label="Like and next" disabled={!visible.length} onClick={() => fly('like')}>
              <Heart fill="currentColor" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Like{keyboard && ' (→)'}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function DeckCard({ ref, item, depth, onSwipe, children }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-320, 0, 320], [-14, 0, 14]);
  const likeOpacity = useTransform(x, [24, 110], [0, 1]);
  const skipOpacity = useTransform(x, [-110, -24], [1, 0]);
  const controls = useDragControls();
  const leaving = useRef(false);
  const isTop = depth === 0;

  const fly = async (dir) => {
    if (leaving.current) return;
    leaving.current = true;
    if (!reduced) {
      const distance = Math.max(window.innerWidth, 640);
      await animate(x, dir === 'like' ? distance : -distance, { duration: 0.3, ease: [0.4, 0, 1, 1] });
    }
    onSwipe(dir, item);
  };

  useImperativeHandle(ref, () => ({ fly }));

  return (
    <motion.div
      className="absolute inset-0 will-change-transform"
      style={{ x, rotate, zIndex: DEPTH.length - depth, touchAction: isTop ? 'pan-y' : 'auto' }}
      initial={false}
      animate={DEPTH[depth]}
      transition={reduced ? { duration: 0 } : SETTLE}
      drag={isTop ? 'x' : false}
      dragListener={false}
      dragControls={controls}
      onPointerDown={(e) => {
        // Media controls, links and buttons inside the card keep their own pointer behaviour.
        if (isTop && !e.target.closest('[data-nodrag], a, button, video')) controls.start(e);
      }}
      onDragEnd={(_, info) => {
        const decision = swipeDecision(info.offset.x, info.velocity.x);
        if (decision) fly(decision);
        else animate(x, 0, reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 });
      }}
      aria-hidden={!isTop}
      inert={!isTop}
    >
      <div className={cn('relative h-full select-none', isTop && 'cursor-grab active:cursor-grabbing')}>
        {children}
        {isTop && (
          <>
            <motion.span style={{ opacity: likeOpacity }} className="pointer-events-none absolute top-5 left-5 -rotate-12 rounded-lg border-2 border-brand bg-card/90 px-3 py-0.5 text-lg font-semibold tracking-widest text-brand-strong uppercase">
              Like
            </motion.span>
            <motion.span style={{ opacity: skipOpacity }} className="pointer-events-none absolute top-5 right-5 rotate-12 rounded-lg border-2 border-foreground bg-card/90 px-3 py-0.5 text-lg font-semibold tracking-widest uppercase">
              Skip
            </motion.span>
          </>
        )}
      </div>
    </motion.div>
  );
}
