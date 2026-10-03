import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Briefcase, CircleCheck, GraduationCap } from 'lucide-react';
import { AvatarGroup } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Logo } from '@/components/brand/Logo';
import PostCard from '@/components/feed/PostCard';
import SwipeDeck from '@/components/feed/SwipeDeck';
import SiteFooter from '@/components/layout/SiteFooter';
import UserAvatar from '@/components/UserAvatar';

// Sample content for the live preview deck. It never touches the API.
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const SAMPLE = [
  {
    _id: 's1', likes: 41, createdAt: minutesAgo(18), headline: 'B.Tech CSE, 3rd year',
    userId: { _id: 'u1', name: 'Riya Menon', username: 'riya' },
    body: 'Finally shipped the attendance bot for our section. It reads the timetable and pings you ten minutes before every lab. Looking for two people to help build the iOS widget.',
  },
  {
    _id: 's2', likes: 87, createdAt: minutesAgo(95), headline: 'B.Des, final year',
    userId: { _id: 'u2', name: 'Kavya Rao', username: 'kavya' },
    body: 'Our final-year design show opens Friday in the Block 4 atrium. One very tired batch, a lot of foam board. Come say hi.',
  },
  {
    _id: 's3', likes: 26, createdAt: minutesAgo(240), headline: 'BBA, 2nd year',
    userId: { _id: 'u3', name: 'Arjun Shetty', username: 'arjun' },
    body: 'We made it to the regional round of the case competition. Thank you to everyone who sat through three mock pitches last week.',
  },
  {
    _id: 's4', likes: 12, createdAt: minutesAgo(600), headline: 'B.Sc Data Science, 1st year',
    userId: { _id: 'u4', name: 'Ananya Iyer', username: 'ananya' },
    body: 'Probability and Statistics study group meets Tuesdays at the library, 5 pm. Bring questions, leave with answers. Hopefully.',
  },
  {
    _id: 's5', likes: 9, createdAt: minutesAgo(1500), headline: 'B.Tech ECE, final year',
    userId: { _id: 'u5', name: 'Farhan Siddiqui', username: 'farhan' },
    body: 'Passing on my Arduino starter kit and a breadboard set before I graduate. ECE juniors get first dibs.',
  },
];

export default function Landing() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link to="/" aria-label="Nexora home"><Logo /></Link>
          <nav aria-label="Account" className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
            <Button asChild><Link to="/signup">Join Nexora</Link></Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:pt-20">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="outline" className="h-7 px-3 text-sm font-normal text-muted-foreground">For Presidency University students</Badge>
            <h1 className="max-w-[14ch] text-5xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl">
              Your campus, one swipe at a time.
            </h1>
            <p className="max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
              The student network for Presidency University. Swipe through what your batch ships and meet people across departments.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/signup">Join Nexora<ArrowRight data-icon="inline-end" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline"><Link to="/login">Sign in</Link></Button>
            </div>
          </div>
          <PreviewDeck />
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-10">
          <h2 className="mb-8 max-w-[22ch] text-3xl font-semibold sm:text-4xl">Less feed. More campus.</h2>
          <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
            <article className="flex flex-col gap-8 overflow-hidden rounded-2xl border bg-brand/10 p-6 sm:p-8 md:col-span-2 md:row-span-2">
              <div className="max-w-md">
                <h3 className="text-2xl font-semibold">A feed with an end</h3>
                <p className="mt-2 text-muted-foreground">No infinite scroll and no ranking. Swipe through today's posts, then get on with your day.</p>
              </div>
              <div className="relative flex min-h-64 flex-1 items-center justify-center py-6">
                <div aria-hidden="true" className="absolute h-40 w-[min(100%,20rem)] -rotate-6 rounded-2xl border bg-card/50" />
                <div aria-hidden="true" className="absolute h-40 w-[min(100%,20rem)] rotate-3 rounded-2xl border bg-card/75" />
                <div className="relative w-[min(100%,22rem)] rounded-2xl border bg-card p-2 shadow-lg">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="bg-brand text-brand-foreground"><CircleCheck /></EmptyMedia>
                    <EmptyTitle>You're all caught up</EmptyTitle>
                    <EmptyDescription>That's every post from your campus. Check back later, or add your own.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
                </div>
              </div>
            </article>

            <article className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
              <div>
                <h3 className="text-lg font-semibold">Profiles that read like a résumé</h3>
                <p className="mt-1 text-sm text-muted-foreground">Experience and education up front, with a one-click PDF.</p>
              </div>
              <ItemGroup className="gap-2">
                <Item variant="muted" size="xs">
                  <ItemMedia variant="icon"><Briefcase /></ItemMedia>
                  <ItemContent><ItemTitle>Teaching assistant</ItemTitle><ItemDescription>Dept. of Computer Science</ItemDescription></ItemContent>
                </Item>
                <Item variant="muted" size="xs">
                  <ItemMedia variant="icon"><GraduationCap /></ItemMedia>
                  <ItemContent><ItemTitle>Presidency University</ItemTitle><ItemDescription>B.Tech, Computer Science</ItemDescription></ItemContent>
                </Item>
              </ItemGroup>
            </article>

            <article className="flex flex-col justify-between gap-5 rounded-2xl bg-foreground p-6 text-background">
              <div>
                <h3 className="text-lg font-semibold">Connections across departments</h3>
                <p className="mt-1 text-sm opacity-70">Find project partners in design, business and engineering.</p>
              </div>
              <AvatarGroup className="*:data-[slot=avatar]:ring-foreground">
                {SAMPLE.map((p) => <UserAvatar key={p._id} user={p.userId} className="size-10" />)}
              </AvatarGroup>
            </article>
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
            <h2 className="text-3xl font-semibold sm:text-4xl">No ads. No algorithm. Just your campus.</h2>
            <p className="text-muted-foreground">Free for every Presidency University student.</p>
            <Button asChild size="lg"><Link to="/signup">Join Nexora</Link></Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function PreviewDeck() {
  const [offset, setOffset] = useState(0);
  const [liked, setLiked] = useState(() => new Set());
  // Rotating the list keeps the demo endless without reusing React keys.
  const items = [...SAMPLE.slice(offset), ...SAMPLE.slice(0, offset)];

  const toggle = (id) => setLiked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <div className="mx-auto w-full max-w-[380px]">
      <SwipeDeck
        items={items}
        index={0}
        label="Sample posts"
        stageClassName="h-[380px]"
        onSwipe={(dir, post) => {
          if (dir === 'like') setLiked((prev) => new Set(prev).add(post._id));
          setOffset((o) => (o + 1) % SAMPLE.length);
        }}
        renderCard={(post) => {
          const isLiked = liked.has(post._id);
          return (
            <PostCard
              post={{ ...post, likes: post.likes + (isLiked ? 1 : 0) }}
              headline={post.headline}
              liked={isLiked}
              onToggleLike={() => toggle(post._id)}
              linkAuthor={false}
            />
          );
        }}
      />
    </div>
  );
}
