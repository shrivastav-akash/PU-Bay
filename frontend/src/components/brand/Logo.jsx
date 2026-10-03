import { cn } from '@/lib/utils';

// Two offset cards: the swipe deck is the product's signature gesture,
// so the mark is the deck mid-swipe with the coral card on top.
export function LogoMark({ className, ...props }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-7 shrink-0', className)} {...props}>
      <rect x="3.5" y="7.5" width="15.5" height="20.5" rx="4" transform="rotate(-10 11.25 17.75)" fill="currentColor" opacity="0.22" />
      <rect x="12" y="4" width="15.5" height="20.5" rx="4" transform="rotate(9 19.75 14.25)" fill="var(--brand)" />
    </svg>
  );
}

export function Logo({ className, markClassName }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-foreground', className)}>
      <LogoMark className={markClassName} />
      <span className="font-heading text-xl font-semibold tracking-[-0.035em]">nexora</span>
    </span>
  );
}
