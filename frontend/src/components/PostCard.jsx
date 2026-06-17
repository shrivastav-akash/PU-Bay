/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { Heart, MessageCircle, Share2, Trash2, Send, UserPlus, Check, Clock, User } from 'lucide-react';

export default function PostCard({ 
  post, 
  token, 
  currentUser, 
  onPostDeleted, 
  sentRequests, 
  receivedRequests, 
  allProfiles, 
  onConnectionUpdated,
  swipeDirection = 'right',
  onViewProfile,
  onPostLiked
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [addCommentLoading, setAddCommentLoading] = useState(false);

  // Reset likes and comments when swiping to a different post
  useEffect(() => {
    setLikesCount(post.likes || 0);
    setHasLiked(false);
    setShowComments(false);
    setComments([]);
    setIsRequesting(false);
  }, [post?._id]);

  // Sync likes count when props update externally (e.g. from database sync)
  useEffect(() => {
    setLikesCount(post.likes || 0);
  }, [post.likes]);

  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get_comment?postId=${post._id}`);
      const data = await response.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  }, [post._id]);

  // Load comments when toggled
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, fetchComments]);



  const handleLike = async () => {
    // Optimistic update
    const newLikes = likesCount + 1;
    setLikesCount(newLikes);
    setHasLiked(true);
    if (onPostLiked) {
      onPostLiked(post._id, newLikes);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/increment_likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, postId: post._id })
      });
      const data = await response.json();
      if (!data.success) {
        // Rollback
        const rolledBackLikes = newLikes - 1;
        setLikesCount(rolledBackLikes);
        setHasLiked(false);
        if (onPostLiked) {
          onPostLiked(post._id, rolledBackLikes);
        }
      }
    } catch (err) {
      console.error("Error liking post:", err);
      const rolledBackLikes = newLikes - 1;
      setLikesCount(rolledBackLikes);
      setHasLiked(false);
      if (onPostLiked) {
        onPostLiked(post._id, rolledBackLikes);
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setAddCommentLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/comment_post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          postId: post._id,
          commentBody: newComment
        })
      });
      const data = await response.json();
      if (data.success) {
        setNewComment('');
        fetchComments();
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setAddCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/delete_comment_of_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, commentId })
      });
      const data = await response.json();
      if (data.success) {
        fetchComments();
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/delete_post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, postId: post._id })
      });
      const data = await response.json();
      if (data.success) {
        onPostDeleted();
      } else {
        alert(data.message || "Failed to delete post");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleSendConnection = async (receiverId) => {
    setIsRequesting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/send_connection_request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, receiverId })
      });
      const data = await response.json();
      if (data.success) {
        onConnectionUpdated();
      } else {
        alert(data.message || "Failed to send request");
        setIsRequesting(false);
      }
    } catch (err) {
      console.error("Error sending connection:", err);
      setIsRequesting(false);
    }
  };

  const handleShare = () => {
    const textToCopy = `PU-Bay Post by ${post.userId.name}: "${post.body}"`;
    navigator.clipboard.writeText(textToCopy);
    alert("Copied post details to clipboard!");
  };

  // Determine connection status for the post author
  const getConnectionButton = () => {
    if (!currentUser || !post.userId) return null;
    if (isRequesting) {
      return (
        <span style={{ 
          fontSize: '0.8rem', 
          color: 'var(--text-secondary)', 
          fontWeight: 600, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem',
          padding: '0.4rem 0.8rem',
          background: 'var(--input-bg)',
          borderRadius: 'var(--border-radius-md)',
          flexShrink: 0
        }}>
          <Clock size={14} /> Pending
        </span>
      );
    }
    if (post.userId._id === currentUser._id) {
      return (
        <button 
          className="btn btn-secondary" 
          onClick={handleDeletePost}
          style={{ color: 'var(--danger-color)', padding: '0.4rem 0.6rem', flexShrink: 0 }}
          title="Delete Post"
        >
          <Trash2 size={16} />
        </button>
      );
    }

    // Check sent requests
    const sentReq = sentRequests.find(req => req.connectionId?._id === post.userId._id);
    if (sentReq) {
      if (sentReq.status_accepted === true) {
        return (
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#10b981', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            padding: '0.4rem 0.8rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 'var(--border-radius-md)',
            flexShrink: 0
          }}>
            <Check size={14} /> Connected
          </span>
        );
      }
      return (
        <span style={{ 
          fontSize: '0.8rem', 
          color: 'var(--text-secondary)', 
          fontWeight: 600, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem',
          padding: '0.4rem 0.8rem',
          background: 'var(--input-bg)',
          borderRadius: 'var(--border-radius-md)',
          flexShrink: 0
        }}>
          <Clock size={14} /> Pending
        </span>
      );
    }

    // Check received requests
    const recReq = receivedRequests.find(req => req.userId?._id === post.userId._id);
    if (recReq) {
      if (recReq.status_accepted === true) {
        return (
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#10b981', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            padding: '0.4rem 0.8rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 'var(--border-radius-md)',
            flexShrink: 0
          }}>
            <Check size={14} /> Connected
          </span>
        );
      }
      return (
        <span style={{ 
          fontSize: '0.8rem', 
          color: 'var(--accent-color)', 
          fontWeight: 600, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem',
          padding: '0.4rem 0.8rem',
          background: 'var(--accent-glow)',
          borderRadius: 'var(--border-radius-md)',
          flexShrink: 0
        }}>
          Respond in Profile
        </span>
      );
    }

    return (
      <button 
        className="btn btn-secondary" 
        onClick={() => handleSendConnection(post.userId._id)}
        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderColor: 'var(--accent-color)', color: 'var(--accent-color)', flexShrink: 0 }}
      >
        <UserPlus size={14} /> Connect
      </button>
    );
  };

  // Find headline of the poster if possible from all profiles
  const posterProfile = allProfiles.find(p => p.userId?._id === post.userId?._id);
  const rawHeadline = posterProfile?.currentPost || "Student at Panjab University";
  const words = rawHeadline.trim().split(/\s+/);
  const headline = words.length > 3 
    ? words.slice(0, 3).join(' ') + '...' 
    : rawHeadline;

  // WhatsApp-style show more logic
  const maxChars = 180;
  const isLongText = post.body.length > maxChars;
  const displayText = isLongText && !isExpanded 
    ? `${post.body.slice(0, maxChars)}... ` 
    : post.body;

  const authorAvatarUrl = post.userId?.profilePicture && post.userId.profilePicture !== 'default.jpg'
    ? `${API_BASE_URL}/${post.userId.profilePicture}`
    : null;

  return (
    <div className={`glow-card swipe-card ${swipeDirection === 'left' ? 'swipe-left' : 'swipe-right'}`}>
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', width: '100%', minWidth: 0 }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', minWidth: 0, flex: 1 }}
          onClick={() => onViewProfile && onViewProfile(post.userId?._id)}
        >
          {authorAvatarUrl ? (
            <img 
              src={authorAvatarUrl} 
              alt={post.userId.name} 
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid var(--accent-color)',
                flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              backgroundColor: 'var(--input-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid var(--accent-color)',
              flexShrink: 0
            }}>
              <User size={20} />
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.userId?.name}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{headline}</p>
          </div>
        </div>
        {getConnectionButton()}
      </div>

      {/* Media if present */}
      {post.media && (
        <div style={{
          backgroundColor: '#000',
          borderRadius: 'var(--border-radius-md)',
          overflow: 'hidden',
          maxHeight: '340px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px solid var(--border-color)'
        }}>
          {['mp4', 'mov', 'avi', 'webm'].includes(post.fileType) ? (
            <video 
              src={`${API_BASE_URL}/${post.media}`} 
              controls 
              style={{ width: '100%', maxHeight: '340px', objectFit: 'contain' }}
            />
          ) : (
            <img 
              src={`${API_BASE_URL}/${post.media}`} 
              alt="Post media" 
              style={{ width: '100%', maxHeight: '340px', objectFit: 'contain' }}
            />
          )}
        </div>
      )}

      {/* Post content body */}
      <div style={{ fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
        <span>{displayText}</span>
        {isLongText && (
          <span 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ 
              color: 'var(--accent-color)', 
              fontWeight: 600, 
              cursor: 'pointer',
              marginLeft: '0.25rem',
              textDecoration: 'underline'
            }}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </span>
        )}
      </div>

      {/* Post Actions Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        borderTop: '1px solid var(--border-color)', 
        borderBottom: '1px solid var(--border-color)',
        padding: '0.75rem 0.25rem' 
      }}>
        <button 
          className="btn btn-secondary" 
          onClick={handleLike}
          disabled={hasLiked}
          style={{ 
            flex: 1, 
            background: 'none', 
            border: 'none', 
            color: hasLiked ? 'var(--accent-color)' : 'var(--text-secondary)' 
          }}
        >
          <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
          <span style={{ fontWeight: 600 }}>{likesCount}</span>
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={() => setShowComments(!showComments)}
          style={{ 
            flex: 1, 
            background: 'none', 
            border: 'none', 
            color: showComments ? 'var(--accent-color)' : 'var(--text-secondary)' 
          }}
        >
          <MessageCircle size={18} />
          <span style={{ fontWeight: 600 }}>Comment</span>
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={handleShare}
          style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-secondary)' }}
        >
          <Share2 size={18} />
          <span style={{ fontWeight: 600 }}>Share</span>
        </button>
      </div>

      {/* Collapsible comments section */}
      {showComments && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.25rem' }}>
          {/* New Comment Form */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Write a comment..." 
              className="input-field"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={addCommentLoading}
              required
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={addCommentLoading || !newComment.trim()}
              style={{ padding: '0.5rem' }}
            >
              <Send size={14} />
            </button>
          </form>

          {/* Comments list */}
          {commentsLoading ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Loading comments...</p>
          ) : comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {comments.map((comment) => {
                const commentAvatar = comment.userId?.profilePicture && comment.userId.profilePicture !== 'default.jpg'
                  ? `${API_BASE_URL}/${comment.userId.profilePicture}`
                  : null;

                return (
                  <div key={comment._id} style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    background: 'var(--input-bg)', 
                    padding: '0.6rem 0.8rem', 
                    borderRadius: 'var(--border-radius-md)',
                    alignItems: 'flex-start'
                  }}>
                    {commentAvatar ? (
                      <img 
                        src={commentAvatar} 
                        alt="Commenter avatar" 
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--card-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-color)'
                      }}>
                        <User size={12} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{comment.userId?.name}</span>
                        {currentUser && comment.userId && comment.userId._id === currentUser._id && (
                          <button 
                            onClick={() => handleDeleteComment(comment._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
                          >
                            <Trash2 size={12} style={{ color: 'var(--danger-color)' }} />
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: '0.85rem', marginTop: '0.15rem', color: 'var(--text-primary)' }}>{comment.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No comments yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
