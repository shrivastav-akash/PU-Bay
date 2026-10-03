import { Link } from 'react-router';
import { Handshake, Inbox, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadError from '@/components/LoadError';
import ConnectButton from '@/components/people/ConnectButton';
import UserAvatar from '@/components/UserAvatar';
import { useData } from '@/context/session';
import { acceptedConnections, pendingInvitations, pendingSent } from '@/lib/connections';

export default function Network() {
  const { sent, received, requests, profileByUserId } = useData();
  const connections = acceptedConnections(sent, received);
  const invites = pendingInvitations(received);
  const outgoing = pendingSent(sent);

  const headline = (u) => profileByUserId.get(u._id)?.currentPost;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Network</h1>
        <p className="text-sm text-muted-foreground">Your connections and the requests waiting on you.</p>
      </div>

      {requests.status === 'loading' && (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-9 w-72 rounded-lg" />
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      )}
      {requests.status === 'error' && <LoadError title="Could not load your network" error={requests.error} onRetry={requests.reload} />}

      {requests.status === 'ready' && (
        <Tabs defaultValue={invites.length ? 'invitations' : 'connections'}>
          <TabsList>
            <TabsTrigger value="connections">Connections <Count n={connections.length} /></TabsTrigger>
            <TabsTrigger value="invitations">Invitations <Count n={invites.length} highlight /></TabsTrigger>
            <TabsTrigger value="sent">Sent <Count n={outgoing.length} /></TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="pt-4">
            {connections.length ? (
              <PeopleList people={connections.map((u) => ({ key: u._id, user: u, headline: headline(u) }))} />
            ) : (
              <EmptyTab icon={Handshake} title="No connections yet" text="Find classmates and project partners on the People page." action />
            )}
          </TabsContent>

          <TabsContent value="invitations" className="pt-4">
            {invites.length ? (
              <PeopleList people={invites.map((r) => ({ key: r._id, user: r.userId, headline: headline(r.userId) }))} />
            ) : (
              <EmptyTab icon={Inbox} title="No pending invitations" text="When someone wants to connect, it shows up here." />
            )}
          </TabsContent>

          <TabsContent value="sent" className="pt-4">
            {outgoing.length ? (
              <PeopleList people={outgoing.map((r) => ({ key: r._id, user: r.connectionId, headline: headline(r.connectionId) }))} />
            ) : (
              <EmptyTab icon={Send} title="No requests waiting" text="Requests you send stay here until they're answered." />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Count({ n, highlight }) {
  if (!n) return null;
  return <Badge variant={highlight ? 'default' : 'secondary'} className="font-mono">{n}</Badge>;
}

function PeopleList({ people }) {
  return (
    <ItemGroup>
      {people.map(({ key, user, headline }) => (
        <Item key={key} variant="outline" className="bg-card">
          <ItemMedia>
            <UserAvatar user={user} className="size-11" />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>
              <Link to={`/u/${user.username}`} className="hover:underline">{user.name}</Link>
            </ItemTitle>
            <ItemDescription className="truncate">{headline || `@${user.username}`}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <ConnectButton userId={user._id} name={user.name} />
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}

function EmptyTab({ icon: Icon, title, text, action }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon"><Icon /></EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{text}</EmptyDescription>
      </EmptyHeader>
      {action && (
        <EmptyContent>
          <Button asChild variant="outline"><Link to="/people">Browse people</Link></Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
