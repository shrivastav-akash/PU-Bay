import { Link } from 'react-router';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import ConnectButton from '@/components/people/ConnectButton';
import UserAvatar from '@/components/UserAvatar';
import { useData } from '@/context/session';
import { pendingInvitations, suggestions } from '@/lib/connections';

export default function RightRail() {
  const { meId, sent, received, profiles, requests, profileByUserId } = useData();
  const loading = profiles.status === 'loading' || requests.status === 'loading';

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }
  // Rail is supplementary; the Network and People pages own the error states.
  if (profiles.status === 'error' || requests.status === 'error') return null;

  const invites = pendingInvitations(received).slice(0, 3);
  const people = suggestions(profiles.data, { meId, sent, received }).slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      {invites.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
            <CardAction><Link to="/network" className="text-sm text-muted-foreground hover:text-foreground">See all</Link></CardAction>
          </CardHeader>
          <CardContent>
            <ItemGroup>
              {invites.map((r) => (
                <PersonRow key={r._id} user={r.userId} headline={profileByUserId.get(r.userId._id)?.currentPost} />
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      )}
      {people.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>People you may know</CardTitle>
            <CardAction><Link to="/people" className="text-sm text-muted-foreground hover:text-foreground">Browse</Link></CardAction>
          </CardHeader>
          <CardContent>
            <ItemGroup>
              {people.map((p) => <PersonRow key={p._id} user={p.userId} headline={p.currentPost} />)}
            </ItemGroup>
          </CardContent>
        </Card>
      )}
      <p className="px-1 text-xs text-muted-foreground">No ads. No algorithm. Just your campus.</p>
    </div>
  );
}

function PersonRow({ user, headline }) {
  return (
    <Item size="xs" className="flex-nowrap px-0">
      <ItemMedia>
        <UserAvatar user={user} className="size-9" />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full truncate">
          <Link to={`/u/${user.username}`} className="truncate hover:underline">{user.name}</Link>
        </ItemTitle>
        <ItemDescription className="truncate">{headline || `@${user.username}`}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <ConnectButton userId={user._id} name={user.name} size="xs" compact />
      </ItemActions>
    </Item>
  );
}
