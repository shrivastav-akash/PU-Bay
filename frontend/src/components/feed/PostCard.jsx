import { useState } from 'react';
import { Link } from 'react-router';
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/UserAvatar';
import { mediaUrl } from '@/lib/api';
import { isVideo, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

const CLAMP = 240;

// Presentational: the feed wires real actions, the landing page passes
// local ones for its sample deck. Omit a handler to hide its control.
export default function PostCard({ post, headline, liked, onToggleLike, onComments, onShare, onDelete, authorAction, linkAuthor = true }) {
  const [expanded, setExpanded] = useState(false);
  const author = post.userId || {};
  const body = post.body || '';
  const long = body.length > CLAMP;
  const text = long && !expanded ? `${body.slice(0, CLAMP).trimEnd()}…` : body;

  const identity = (
    <>
      <UserAvatar user={author} className="size-11" />
      <span className="min-w-0">
        <span className="block truncate leading-tight font-medium">{author.name}</span>
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          {headline && <span className="truncate">{headline}</span>}
          {headline && <span aria-hidden="true">·</span>}
          <time dateTime={post.createdAt} className="shrink-0 font-mono text-xs">{timeAgo(post.createdAt)}</time>
        </span>
      </span>
    </>
  );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_40px_-20px_rgb(0_0_0/0.25)]">
      <header className="flex items-start gap-3 p-4 pb-3">
        {linkAuthor && author.username ? (
          <Link to={`/u/${author.username}`} className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            {identity}
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-3">{identity}</div>
        )}
        {authorAction && <div data-nodrag className="ml-auto shrink-0">{authorAction}</div>}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {text}
          {long && (
            <button type="button" data-nodrag onClick={() => setExpanded((v) => !v)} className="ml-1 font-medium text-brand-strong hover:underline">
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>
        {post.media && (
          <div className="mt-3 overflow-hidden rounded-xl border bg-muted">
            {isVideo(post) ? (
              <video data-nodrag src={mediaUrl(post.media)} controls preload="none" playsInline className="aspect-video w-full bg-black object-contain" />
            ) : (
              <img src={mediaUrl(post.media)} alt={`Shared by ${author.name || 'a student'}`} loading="lazy" draggable={false} className="max-h-80 w-full object-cover" />
            )}
          </div>
        )}
      </div>

      <footer data-nodrag className="flex items-center gap-1 border-t px-2 py-1.5">
        {onToggleLike && (
          <Button variant="ghost" size="sm" aria-pressed={!!liked} aria-label={liked ? 'Unlike' : 'Like'} onClick={onToggleLike} className={cn(liked && 'text-brand-strong hover:text-brand-strong')}>
            <Heart data-icon="inline-start" fill={liked ? 'currentColor' : 'none'} />
            <span className="font-mono">{post.likes || 0}</span>
          </Button>
        )}
        {onComments && (
          <Button variant="ghost" size="sm" onClick={onComments}>
            <MessageCircle data-icon="inline-start" />
            Comments
          </Button>
        )}
        <div className="ml-auto flex">
          {onShare && (
            <Button variant="ghost" size="icon-sm" aria-label={`Copy link to ${author.name || 'author'}'s profile`} onClick={onShare}>
              <Share2 />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon-sm" aria-label="Delete post" onClick={onDelete} className="hover:text-destructive">
              <Trash2 />
            </Button>
          )}
        </div>
      </footer>
    </article>
  );
}
