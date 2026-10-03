import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Logo } from '@/components/brand/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-4">
      <Link to="/" aria-label="Nexora home"><Logo /></Link>
      <Empty className="max-w-md border">
        <EmptyHeader>
          <EmptyMedia variant="icon"><Compass /></EmptyMedia>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>The link may be broken, or the page may have moved.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent><Button asChild><Link to="/">Back to Nexora</Link></Button></EmptyContent>
      </Empty>
    </div>
  );
}
