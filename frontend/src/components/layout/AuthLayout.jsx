import { Link } from 'react-router';
import { Logo, LogoMark } from '@/components/brand/Logo';

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Link to="/" aria-label="Nexora home" className="w-fit"><Logo /></Link>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
      <div className="relative hidden flex-col justify-end overflow-hidden border-l bg-muted p-12 lg:flex">
        <LogoMark className="absolute -top-20 -right-24 size-[30rem] text-foreground" />
        <p className="relative max-w-md text-3xl leading-tight font-semibold tracking-[-0.03em]">Your campus, one swipe at a time.</p>
        <p className="relative mt-3 max-w-sm text-muted-foreground">Posts, profiles and connections from Presidency University students.</p>
      </div>
    </div>
  );
}
