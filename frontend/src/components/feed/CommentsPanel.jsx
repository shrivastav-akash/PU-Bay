import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import LoadError from '@/components/LoadError';
import UserAvatar from '@/components/UserAvatar';
import { useData } from '@/context/session';
import { api } from '@/lib/api';
import { useLoader } from '@/lib/use-loader';
import { useMediaQuery } from '@/lib/use-media-query';

// Side sheet on desktop, bottom drawer on phones.
export default function CommentsPanel({ post, open, onOpenChange }) {
  const desktop = useMediaQuery('(min-width: 768px)');
  const title = 'Comments';
  const description = post ? `On ${post.userId?.name || 'this'}'s post` : '';
  const thread = post && <Thread key={post._id} post={post} />;

  if (desktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          {thread}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        {thread}
      </DrawerContent>
    </Drawer>
  );
}

function Thread({ post }) {
  const { token, meId } = useData();
  const load = useCallback(() => api(`/get_comment?postId=${encodeURIComponent(post._id)}`), [post._id]);
  const comments = useLoader(load);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [removing, setRemoving] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      await api('/comment_post', { method: 'POST', body: { postId: post._id, commentBody: body }, token });
      setDraft('');
      await comments.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const remove = async (commentId) => {
    setRemoving(commentId);
    try {
      await api('/delete_comment_of_user', { method: 'POST', body: { commentId }, token });
      await comments.reload();
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {comments.status === 'loading' && (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}
        {comments.status === 'error' && <LoadError title="Could not load comments" error={comments.error} onRetry={comments.reload} />}
        {comments.status === 'ready' && comments.data.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><MessageCircle /></EmptyMedia>
              <EmptyTitle>No comments yet</EmptyTitle>
              <EmptyDescription>Start the conversation.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {comments.status === 'ready' && comments.data.length > 0 && (
          <ul className="flex flex-col gap-4">
            {comments.data.map((c) => (
              <li key={c._id} className="group flex gap-3">
                <UserAvatar user={c.userId} className="size-8" />
                <div className="min-w-0 flex-1">
                  {c.userId?.username ? (
                    <Link to={`/u/${c.userId.username}`} className="text-sm font-medium hover:underline">{c.userId.name}</Link>
                  ) : (
                    <span className="text-sm font-medium">Deleted user</span>
                  )}
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{c.body}</p>
                </div>
                {c.userId?._id === meId && (
                  <Button variant="ghost" size="icon-xs" aria-label="Delete comment" disabled={removing === c._id} onClick={() => remove(c._id)} className="text-muted-foreground hover:text-destructive">
                    {removing === c._id ? <Spinner /> : <Trash2 />}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={submit} className="border-t p-3">
        <InputGroup>
          <InputGroupInput value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a comment" aria-label="Write a comment" maxLength={1000} />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" size="icon-xs" aria-label="Send comment" disabled={sending || !draft.trim()}>
              {sending ? <Spinner /> : <Send />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  );
}
