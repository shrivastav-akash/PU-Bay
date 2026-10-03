import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { toast } from 'sonner';
import { CircleCheck, PenLine, RotateCcw } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import CommentsPanel from '@/components/feed/CommentsPanel';
import PostCard from '@/components/feed/PostCard';
import SwipeDeck from '@/components/feed/SwipeDeck';
import LoadError from '@/components/LoadError';
import ConnectButton from '@/components/people/ConnectButton';
import { useData } from '@/context/session';
import { api } from '@/lib/api';

// Phones lose ~390px to the top bar, page header, deck buttons and tab bar.
const STAGE = 'h-[clamp(360px,calc(100dvh-390px),560px)] md:h-[clamp(420px,calc(100dvh-300px),560px)]';

export default function Feed() {
  const { openComposer } = useOutletContext();
  const { token, meId, posts, profileByUserId, feedIndex, setFeedIndex, setLike } = useData();
  const [comments, setComments] = useState({ open: false, post: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const list = posts.data || [];
  const done = posts.status === 'ready' && list.length > 0 && feedIndex >= list.length;
  const showDeck = posts.status === 'ready' && list.length > 0 && !done;

  const like = (post, liked) => setLike(post, liked).catch((err) => toast.error(err.message));

  const share = async (post) => {
    const url = `${window.location.origin}/u/${post.userId?.username}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`Link to ${post.userId?.name}'s profile copied`);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api('/delete_post', { method: 'POST', body: { postId: toDelete._id }, token });
      // The index now points at the post after the deleted one.
      await posts.reload();
      toast.success('Post deleted');
      setToDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-[440px] flex-col">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Feed</h1>
          {showDeck && (
            <p className="text-sm text-muted-foreground">
              <span className="md:hidden">Swipe a card to move on</span>
              <span className="hidden md:inline">Drag a card, or use <kbd className="font-mono">←</kbd> <kbd className="font-mono">→</kbd></span>
            </p>
          )}
        </div>
        {showDeck && (
          <p className="rounded-full border px-3 py-1 font-mono text-xs text-muted-foreground" aria-live="polite">
            {feedIndex + 1} / {list.length}
          </p>
        )}
      </div>

      {posts.status === 'loading' && <DeckSkeleton />}
      {posts.status === 'error' && <LoadError title="Could not load the feed" error={posts.error} onRetry={posts.reload} />}

      {posts.status === 'ready' && list.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><PenLine /></EmptyMedia>
            <EmptyTitle>Nothing posted yet</EmptyTitle>
            <EmptyDescription>Be the first to share what you're working on.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent><Button onClick={openComposer}>Create a post</Button></EmptyContent>
        </Empty>
      )}

      {done && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><CircleCheck /></EmptyMedia>
            <EmptyTitle>You're all caught up</EmptyTitle>
            <EmptyDescription>That's every post from your campus. Check back later, or add your own.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button variant="outline" onClick={() => setFeedIndex(0)}>
              <RotateCcw data-icon="inline-start" />
              Start over
            </Button>
            <Button onClick={openComposer}>Create a post</Button>
          </EmptyContent>
        </Empty>
      )}

      {showDeck && (
        <SwipeDeck
          items={list}
          index={feedIndex}
          keyboard
          label="Campus feed"
          stageClassName={STAGE}
          onSwipe={(dir, post) => {
            if (dir === 'like') like(post, true);
            setFeedIndex((i) => i + 1);
          }}
          renderCard={(post) => {
            const authorId = post.userId?._id;
            const liked = (post.likedBy || []).includes(meId);
            return (
              <PostCard
                post={post}
                headline={profileByUserId.get(authorId)?.currentPost}
                liked={liked}
                onToggleLike={() => like(post, !liked)}
                onComments={() => setComments({ open: true, post })}
                onShare={post.userId?.username ? () => share(post) : undefined}
                onDelete={authorId === meId ? () => setToDelete(post) : undefined}
                authorAction={authorId && authorId !== meId ? <ConnectButton userId={authorId} name={post.userId?.name} size="xs" compact /> : null}
              />
            );
          }}
        />
      )}

      <CommentsPanel post={comments.post} open={comments.open} onOpenChange={(open) => setComments((c) => ({ ...c, open }))} />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>It disappears from everyone's feed. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={(e) => { e.preventDefault(); confirmDelete(); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DeckSkeleton() {
  return (
    <div className="flex flex-col items-center gap-12" aria-busy="true" aria-label="Loading posts">
      <div className={`flex w-full flex-col gap-4 rounded-2xl border bg-card p-4 ${STAGE}`}>
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 w-full flex-1 rounded-xl" />
      </div>
      <div className="flex gap-5">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="size-12 rounded-full" />
      </div>
    </div>
  );
}
