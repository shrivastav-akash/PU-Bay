/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, authHeaders } from '../config';
import { Heart, MessageCircle, Share2, Send, X, Check, Clock, Plus, Trash2 } from 'lucide-react';
import Avatar from './Avatar';

const VIDEO_TYPES = ['mp4', 'mov', 'avi', 'webm'];
const MAX_BODY = 210;

export default function PostCard({
  post,
  token,
  currentUser,
  sentRequests = [],
  receivedRequests = [],
  allProfiles = [],
  onConnectionUpdated,
  onViewProfile,
  liked = false,
  onLike,
  onSkip,
  onHeart,
  onShare,
  onDeletePost,
  likeStampOpacity = 0,
  skipStampOpacity = 0,
}) {
  const [showFull, setShowFull] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    setShowFull(false);
    setShowComments(false);
    setComments([]);
    setCommentDraft('');
    setRequesting(false);
  }, [post?._id]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/get_comment?postId=${post._id}`);
      const data = await res.json();
      if (data.success) setComments(data.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }, [post._id]);

  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments, fetchComments]);

  const submitComment = async (e) => {
    e.preventDefault();
    const body = commentDraft.trim();
    if (!body) return;
    setCommentDraft('');
    try {
      const res = await fetch(`${API_BASE_URL}/comment_post`, {
        method: 'POST',
        headers: authHeaders(token, true),
        body: JSON.stringify({ postId: post._id, commentBody: body }),
      });
      const data = await res.json();
      if (data.success) fetchComments();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleConnect = async (receiverId) => {
    setRequesting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/send_connection_request`, {
        method: 'POST',
        headers: authHeaders(token, true),
        body: JSON.stringify({ receiverId }),
      });
      const data = await res.json();
      if (data.success) onConnectionUpdated && onConnectionUpdated();
      else setRequesting(false);
    } catch (err) {
      console.error('Error sending connection:', err);
      setRequesting(false);
    }
  };

  // ---- connection state for the post author ----
  const authorId = post.userId?._id;
  const isSelf = currentUser && authorId === currentUser._id;
  const sentReq = sentRequests.find((r) => r.connectionId?._id === authorId);
  const recReq = receivedRequests.find((r) => r.userId?._id === authorId);
  const connected = sentReq?.status_accepted === true || recReq?.status_accepted === true;
  const pending = requesting || (sentReq && sentReq.status_accepted === null);
  const respond = recReq && recReq.status_accepted === null;

  const pillBase = {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, borderRadius: 9,
    padding: '6px 11px', fontWeight: 800, fontSize: 12.5,
  };

  const renderConnect = () => {
    if (isSelf) {
      return <span style={{ ...pillBase, color: 'var(--soft)', background: 'var(--pill)', border: '1.5px solid var(--border)' }}>You</span>;
    }
    if (connected) {
      return (
        <span style={{ ...pillBase, color: 'var(--good)', background: 'var(--good-bg)', border: '1.5px solid var(--good)' }}>
          <Check size={13} />Connected
        </span>
      );
    }
    if (respond) {
      return <span style={{ ...pillBase, color: 'var(--accent)', background: 'var(--pill)', border: '1.5px solid var(--accent)' }}>Wants to connect</span>;
    }
    if (pending) {
      return (
        <span style={{ ...pillBase, color: 'var(--soft)', background: 'var(--pill)', border: '1.5px solid var(--border)' }}>
          <Clock size={13} />Pending
        </span>
      );
    }
    return (
      <button
        data-nodrag
        onClick={() => handleConnect(authorId)}
        style={{ ...pillBase, color: 'var(--accent)', background: 'var(--card)', border: '1.5px solid var(--accent)', cursor: 'pointer' }}
      >
        <Plus size={14} />Connect
      </button>
    );
  };

  // ---- headline ----
  const posterProfile = allProfiles.find((p) => p.userId?._id === authorId);
  const headline = posterProfile?.currentPost || 'Student at Panjab University';
  const subline = `${headline} · ${timeAgo(post.createdAt)}`;

  const isLong = post.body.length > MAX_BODY;
  const bodyText = isLong && !showFull ? `${post.body.slice(0, MAX_BODY).trim()}… ` : post.body;
  const isVideo = VIDEO_TYPES.includes(post.fileType);

  return (
    <div
      style={{
        position: 'relative', height: '100%', background: 'var(--card)', border: '2px solid var(--line)',
        borderRadius: 18, boxShadow: '6px 6px 0 var(--shadow)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* swipe stamps */}
      <div style={{ position: 'absolute', top: 22, left: 18, zIndex: 9, border: '3px solid var(--good)', color: 'var(--good)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, padding: '1px 11px', borderRadius: 9, transform: 'rotate(-14deg)', opacity: likeStampOpacity, letterSpacing: '0.05em', pointerEvents: 'none' }}>LIKED</div>
      <div style={{ position: 'absolute', top: 22, right: 18, zIndex: 9, border: '3px solid var(--ink)', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, padding: '1px 11px', borderRadius: 9, transform: 'rotate(14deg)', opacity: skipStampOpacity, letterSpacing: '0.05em', pointerEvents: 'none' }}>SKIP</div>

      {/* scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px 20px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div
            data-nodrag
            onClick={() => onViewProfile && onViewProfile(authorId)}
            style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', minWidth: 0 }}
          >
            <Avatar user={post.userId} size={46} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{post.userId?.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subline}</div>
            </div>
          </div>
          {renderConnect()}
        </div>

        <div style={{ marginTop: 16, fontSize: 16, lineHeight: 1.55, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
          {bodyText}
          {isLong && (
            <span data-nodrag onClick={() => setShowFull(!showFull)} style={{ color: 'var(--accent)', fontWeight: 800, cursor: 'pointer' }}>
              {showFull ? 'show less' : 'read more'}
            </span>
          )}
        </div>

        {post.media && (
          <div style={{ marginTop: 14, border: '1.5px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--pill)' }}>
            {isVideo ? (
              <video data-nodrag src={`${API_BASE_URL}/${post.media}`} controls style={{ display: 'block', width: '100%', maxHeight: 300, objectFit: 'contain' }} />
            ) : (
              <img src={`${API_BASE_URL}/${post.media}`} alt="Post media" draggable={false} style={{ display: 'block', width: '100%', height: 'auto', maxHeight: 300, objectFit: 'cover' }} />
            )}
          </div>
        )}

        {showComments && (
          <div data-nodrag style={{ marginTop: 16, borderTop: '1.5px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <form onSubmit={submitComment} style={{ display: 'flex', gap: 8 }}>
              <input
                className="pu-input"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Add a comment…"
                style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--pill)', color: 'var(--ink)', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' }}
              />
              <button type="submit" style={{ width: 38, flexShrink: 0, background: 'var(--accent)', color: 'var(--accent-ink)', border: '1.5px solid var(--line)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={16} />
              </button>
            </form>
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c._id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <Avatar user={c.userId} size={30} style={{ border: '1px solid var(--line)' }} />
                  <div style={{ background: 'var(--pill)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 11px', flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 12.5, color: 'var(--ink)' }}>{c.userId?.name}</div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink)', marginTop: 1, lineHeight: 1.4 }}>{c.body}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--soft)', textAlign: 'center', padding: '4px 0' }}>Be the first to comment.</div>
            )}
          </div>
        )}
      </div>

      {/* action footer */}
      <div data-nodrag style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '11px 16px', borderTop: '1.5px solid var(--border)', background: 'var(--card)' }}>
        <button onClick={onSkip} title="Skip" className="pu-press" style={iconCircle('var(--card)', 'var(--ink)')}>
          <X size={20} />
        </button>
        <button
          onClick={onHeart}
          title={liked ? 'Remove like' : 'Like'}
          aria-pressed={liked}
          className="pu-hov-accent"
          style={{ ...ghostBtn, color: liked ? 'var(--accent)' : 'var(--soft)' }}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          <span style={{ fontSize: 13.5, fontWeight: 800 }}>{post.likes || 0}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="pu-hov-ink" style={ghostBtn}>
          <MessageCircle size={18} />
          <span style={{ fontSize: 13.5, fontWeight: 800 }}>{comments.length || post.commentCount || 0}</span>
        </button>
        {isSelf ? (
          <button onClick={() => onDeletePost && onDeletePost(post)} title="Delete post" className="pu-hov-ink" style={{ ...ghostBtn, color: 'var(--danger)' }}>
            <Trash2 size={18} />
          </button>
        ) : (
          <button onClick={onShare} title="Share" className="pu-hov-ink" style={{ ...ghostBtn, padding: 6 }}>
            <Share2 size={18} />
          </button>
        )}
        <button onClick={onLike} title="Like & next" className="pu-press" style={iconCircle('var(--accent)', 'var(--accent-ink)')}>
          <Heart size={19} fill="currentColor" stroke="none" />
        </button>
      </div>
    </div>
  );
}

const ghostBtn = {
  display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
  color: 'var(--soft)', cursor: 'pointer', fontFamily: 'inherit', padding: 6,
};

function iconCircle(bg, color) {
  return {
    width: 46, height: 46, flexShrink: 0, borderRadius: '50%', border: '2px solid var(--line)',
    background: bg, color, boxShadow: '2px 2px 0 var(--shadow)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

function timeAgo(dateStr) {
  if (!dateStr) return 'now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
