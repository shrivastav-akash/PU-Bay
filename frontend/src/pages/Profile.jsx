import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { Briefcase, Download, GraduationCap, Heart, PenLine, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadError from '@/components/LoadError';
import ConnectButton from '@/components/people/ConnectButton';
import UserAvatar from '@/components/UserAvatar';
import { LogoMark } from '@/components/brand/Logo';
import { useData } from '@/context/session';
import { downloadFile, mediaUrl } from '@/lib/api';
import { fmtDate, isVideo } from '@/lib/format';

export default function Profile() {
  const { username } = useParams();
  const { me, profiles, posts } = useData();
  const own = me.data?.user?.username === username;
  // Own profile comes from /get_user_and_profile so edits show immediately.
  const profile = own ? me.data?.profile : profiles.data?.find((p) => p.userId?.username === username);
  const source = own ? me : profiles;

  if (source.status === 'loading') return <ProfileSkeleton />;
  if (source.status === 'error') return <LoadError title="Could not load this profile" error={source.error} onRetry={source.reload} />;
  if (!profile?.userId) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon"><UserX /></EmptyMedia>
          <EmptyTitle>No one here goes by @{username}</EmptyTitle>
          <EmptyDescription>The handle may have changed, or the account no longer exists.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent><Button asChild variant="outline"><Link to="/people">Browse people</Link></Button></EmptyContent>
      </Empty>
    );
  }

  const user = profile.userId;
  const userPosts = (posts.data || []).filter((p) => p.userId?._id === user._id);

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="relative h-28 bg-muted sm:h-36">
          <LogoMark className="absolute -right-6 -bottom-10 size-44 text-foreground opacity-[0.07] sm:size-56" />
        </div>
        <div className="flex flex-col gap-4 px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-3">
            <UserAvatar user={user} className="size-24 ring-4 ring-card" fallbackClassName="text-2xl" />
            <div className="flex flex-wrap gap-2">
              {own ? (
                <>
                  <Button asChild variant="outline"><Link to="/settings"><PenLine data-icon="inline-start" />Edit profile</Link></Button>
                  <ResumeButton profileId={profile._id} username={user.username} />
                </>
              ) : (
                <ConnectButton userId={user._id} name={user.name} size="default" />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold sm:text-3xl">{user.name}</h1>
            <p className="font-mono text-sm text-muted-foreground">@{user.username}</p>
          </div>
          {profile.currentPost && <p className="text-[15px] font-medium">{profile.currentPost}</p>}
          {profile.bio && <p className="max-w-[65ch] leading-relaxed text-muted-foreground">{profile.bio}</p>}
        </div>
      </section>

      <Tabs defaultValue="resume">
        <TabsList variant="line">
          <TabsTrigger value="resume">Résumé</TabsTrigger>
          <TabsTrigger value="posts">Posts <span className="font-mono text-xs text-muted-foreground">{userPosts.length}</span></TabsTrigger>
        </TabsList>
        <TabsContent value="resume" className="grid gap-4 pt-4 lg:grid-cols-2">
          <ResumeSection icon={Briefcase} title="Experience" empty={own ? 'Add your experience in Settings.' : 'No experience listed.'} items={profile.pastWork} render={(w) => (
            <>
              <div className="min-w-0">
                <p className="font-medium">{w.position}</p>
                <p className="text-sm text-muted-foreground">{w.company}</p>
              </div>
              {w.years && <Badge variant="secondary" className="font-mono">{w.years}</Badge>}
            </>
          )} />
          <ResumeSection icon={GraduationCap} title="Education" empty={own ? 'Add your education in Settings.' : 'No education listed.'} items={profile.education} render={(e) => (
            <div className="min-w-0">
              <p className="font-medium">{e.school}</p>
              <p className="text-sm text-muted-foreground">{[e.degree, e.fieldOfStudy].filter(Boolean).join(', ')}</p>
            </div>
          )} />
        </TabsContent>
        <TabsContent value="posts" className="pt-4">
          {posts.status === 'loading' && <Skeleton className="h-40 rounded-xl" />}
          {posts.status === 'error' && <LoadError title="Could not load posts" error={posts.error} onRetry={posts.reload} />}
          {posts.status === 'ready' && userPosts.length === 0 && (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>No posts yet</EmptyTitle>
                <EmptyDescription>{own ? 'Your posts will show up here.' : `${user.name.split(' ')[0]} hasn't posted yet.`}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {userPosts.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {userPosts.map((p) => (
                <li key={p._id}>
                  <Card className="h-full">
                    {p.media && !isVideo(p) && <img src={mediaUrl(p.media)} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />}
                    <CardContent className="flex flex-1 flex-col gap-3">
                      {p.media && isVideo(p) && <video src={mediaUrl(p.media)} controls preload="none" className="aspect-video w-full rounded-lg bg-black" />}
                      <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap">{p.body}</p>
                      <div className="mt-auto flex items-center justify-between font-mono text-xs text-muted-foreground">
                        <time dateTime={p.createdAt}>{fmtDate(p.createdAt)}</time>
                        <span className="flex items-center gap-1"><Heart className="size-3.5" aria-hidden="true" />{p.likes || 0}<span className="sr-only"> likes</span></span>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResumeSection({ icon: Icon, title, items = [], render, empty }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon className="size-4 text-brand" />{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ol className="flex flex-col gap-4 border-l pl-4">
            {items.map((item, i) => (
              <li key={item._id || i} className="relative flex items-start justify-between gap-3 before:absolute before:top-2 before:-left-[21px] before:size-2 before:rounded-full before:bg-border">
                {render(item)}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ResumeButton({ profileId, username }) {
  const { token } = useData();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await downloadFile(`/user/download_resume?id=${encodeURIComponent(profileId)}`, {
        token,
        filename: `${username}-resume.pdf`,
      });
    } catch (err) {
      toast.error('Could not generate the PDF', { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" onClick={download} disabled={busy}>
      {busy ? <Spinner data-icon="inline-start" /> : <Download data-icon="inline-start" />}
      Résumé PDF
    </Button>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <Skeleton className="h-64 rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
