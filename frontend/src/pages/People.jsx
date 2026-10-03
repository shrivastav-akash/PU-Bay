import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Search, SearchX, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import LoadError from '@/components/LoadError';
import ConnectButton from '@/components/people/ConnectButton';
import UserAvatar from '@/components/UserAvatar';
import { useData } from '@/context/session';

export default function People() {
  const { meId, profiles } = useData();
  const [query, setQuery] = useState('');

  const others = useMemo(() => (profiles.data || []).filter((p) => p.userId && p.userId._id !== meId), [profiles.data, meId]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return others;
    return others.filter((p) => [p.userId.name, p.userId.username, p.currentPost].some((v) => v?.toLowerCase().includes(q)));
  }, [others, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">People</h1>
          <p className="text-sm text-muted-foreground">Students across every department on Nexora.</p>
        </div>
        <InputGroup className="sm:max-w-xs">
          <InputGroupAddon><Search /></InputGroupAddon>
          <InputGroupInput type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, @handle or headline" aria-label="Search people" />
        </InputGroup>
      </div>

      {profiles.status === 'loading' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      )}
      {profiles.status === 'error' && <LoadError title="Could not load people" error={profiles.error} onRetry={profiles.reload} />}

      {profiles.status === 'ready' && others.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Users /></EmptyMedia>
            <EmptyTitle>You're early</EmptyTitle>
            <EmptyDescription>No one else has joined yet. Invite your batchmates.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {profiles.status === 'ready' && others.length > 0 && results.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><SearchX /></EmptyMedia>
            <EmptyTitle>No matches for “{query.trim()}”</EmptyTitle>
            <EmptyDescription>Try a first name or a department.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent><Button variant="outline" onClick={() => setQuery('')}>Clear search</Button></EmptyContent>
        </Empty>
      )}

      {results.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <li key={p._id}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col items-start gap-4">
                  <Link to={`/u/${p.userId.username}`} className="flex w-full min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    <UserAvatar user={p.userId} className="size-12" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium hover:underline">{p.userId.name}</span>
                      <span className="block truncate font-mono text-xs text-muted-foreground">@{p.userId.username}</span>
                    </span>
                  </Link>
                  <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{p.currentPost || 'No headline yet'}</p>
                  <ConnectButton userId={p.userId._id} name={p.userId.name} className="mt-auto" />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
