/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import PostCard from './components/PostCard';
import ProfilePanel from './components/ProfilePanel';
import Avatar from './components/Avatar';
import { API_BASE_URL, authHeaders } from './config';
import {
  ArrowRight, Heart, FileText, Users, Sparkles, X, Image as ImageIcon, Mail,
} from 'lucide-react';

const FEATURES = [
  { icon: <Heart size={22} fill="currentColor" stroke="none" />, title: 'Swipeable feed', body: 'Browse campus updates Tinder-style — drag a card, tap a key, fly through your batch.' },
  { icon: <FileText size={22} />, title: 'Résumé profiles', body: 'Build a clean, recruiter-ready profile with experience, education and your latest work.' },
  { icon: <Users size={22} />, title: 'Campus connections', body: 'Send and accept requests to network across departments and find project partners.' },
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [posts, setPosts] = useState([]);
  const [feedIndex, setFeedIndex] = useState(0);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);

  const [allProfiles, setAllProfiles] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [newPostPreview, setNewPostPreview] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [toast, setToast] = useState('');

  // deck drag state
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [fly, setFly] = useState(null); // null | 'left' | 'right'
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const isMobile = vw < 860;

  const dragStart = useRef(null);
  const dragPos = useRef({ x: 0, y: 0 });
  const moveHandler = useRef(null);
  const upHandler = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  // ---- theme ----
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // ---- viewport ----
  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ---- data ----
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(''); setUser(null); setProfile(null);
    setIsProfileOpen(false); setViewedProfile(null); setViewedUser(null);
    setShowAuth(false);
  }, []);

  const fetchUserData = useCallback(async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/get_user_and_profile`, { headers: authHeaders(authToken) });
      const data = await res.json();
      if (data.success) { setUser(data.data.user); setProfile(data.data.profile); }
      else handleLogout();
    } catch (err) { console.error('Error fetching user data:', err); }
  }, [handleLogout]);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/get_all_posts`);
      const data = await res.json();
      if (data.success) {
        const sorted = data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(sorted);
      }
    } catch (err) { console.error('Error fetching posts:', err); }
  }, []);

  const fetchAllProfiles = useCallback(async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/get_all_users`, { headers: authHeaders(authToken) });
      const data = await res.json();
      if (data.success) setAllProfiles(data.data);
    } catch (err) { console.error('Error fetching all profiles:', err); }
  }, []);

  const fetchConnections = useCallback(async (authToken) => {
    try {
      const recRes = await fetch(`${API_BASE_URL}/user/user_connection_request`, { headers: authHeaders(authToken) });
      const recData = await recRes.json();
      if (recData.success) setReceivedRequests(recData.data);
      const sentRes = await fetch(`${API_BASE_URL}/user/get_connection_request`, { headers: authHeaders(authToken) });
      const sentData = await sentRes.json();
      if (sentData.success) setSentRequests(sentData.data);
    } catch (err) { console.error('Error fetching connections:', err); }
  }, []);

  useEffect(() => {
    if (token) { fetchUserData(token); fetchConnections(token); fetchAllProfiles(token); }
    fetchPosts();
  }, [token, fetchUserData, fetchConnections, fetchAllProfiles, fetchPosts]);

  // ---- feed navigation ----
  const len = posts.length;
  const wrap = (i) => ((i % len) + len) % len;
  const currentPost = len ? posts[wrap(feedIndex)] : null;
  const behind1 = len > 1 ? posts[wrap(feedIndex + 1)] : null;
  const behind2 = len > 2 ? posts[wrap(feedIndex + 2)] : null;

  const hasLiked = useCallback((post) => (post?.likedBy || []).some((id) => id === user?._id), [user]);

  const likePost = useCallback(async (post) => {
    if (!post || !token || !user || hasLiked(post)) return;
    setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, likes: (p.likes || 0) + 1, likedBy: [...(p.likedBy || []), user._id] } : p)));
    try {
      const res = await fetch(`${API_BASE_URL}/increment_likes`, {
        method: 'POST', headers: authHeaders(token, true),
        body: JSON.stringify({ postId: post._id }),
      });
      const data = await res.json();
      if (!data.success) {
        setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, likes: Math.max(0, (p.likes || 1) - 1), likedBy: (p.likedBy || []).filter((id) => id !== user._id) } : p)));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  }, [token, user, hasLiked]);

  const unlikePost = useCallback(async (post) => {
    if (!post || !token || !user || !hasLiked(post)) return;
    setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, likes: Math.max(0, (p.likes || 1) - 1), likedBy: (p.likedBy || []).filter((id) => id !== user._id) } : p)));
    try {
      const res = await fetch(`${API_BASE_URL}/decrement_likes`, {
        method: 'POST', headers: authHeaders(token, true),
        body: JSON.stringify({ postId: post._id }),
      });
      const data = await res.json();
      if (!data.success) {
        setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, likes: (p.likes || 0) + 1, likedBy: [...(p.likedBy || []), user._id] } : p)));
      }
    } catch (err) {
      console.error('Error unliking post:', err);
    }
  }, [token, user, hasLiked]);

  const toggleLike = useCallback((post) => {
    if (hasLiked(post)) unlikePost(post); else likePost(post);
  }, [hasLiked, likePost, unlikePost]);

  const advance = useCallback((action) => {
    if (!len || fly) return;
    if (action === 'like') likePost(currentPost);
    setFly(action === 'like' ? 'right' : 'left');
    setTimeout(() => {
      setFeedIndex((i) => i + 1);
      setFly(null);
      setDrag({ x: 0, y: 0, active: false });
    }, 320);
  }, [len, fly, currentPost, likePost]);

  // ---- drag ----
  const removeDragListeners = () => {
    if (moveHandler.current) window.removeEventListener('pointermove', moveHandler.current);
    if (upHandler.current) window.removeEventListener('pointerup', upHandler.current);
    moveHandler.current = upHandler.current = dragStart.current = null;
  };

  const startDrag = (e) => {
    if (fly) return;
    if (e.target?.closest?.('[data-nodrag]')) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragPos.current = { x: 0, y: 0 };
    moveHandler.current = (ev) => {
      if (!dragStart.current) return;
      const next = { x: ev.clientX - dragStart.current.x, y: ev.clientY - dragStart.current.y };
      dragPos.current = next;
      setDrag({ ...next, active: true });
    };
    upHandler.current = () => {
      removeDragListeners();
      const { x } = dragPos.current;
      if (x > 110) advance('like');
      else if (x < -110) advance('skip');
      else setDrag({ x: 0, y: 0, active: false });
    };
    window.addEventListener('pointermove', moveHandler.current);
    window.addEventListener('pointerup', upHandler.current);
    setDrag({ x: 0, y: 0, active: true });
  };
  useEffect(() => removeDragListeners, []);

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e) => {
      if (!token || isProfileOpen || isCreateOpen || isPrivacyOpen || isContactOpen) return;
      const a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') advance('like');
      else if (e.key === 'ArrowLeft') advance('skip');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [token, isProfileOpen, isCreateOpen, isPrivacyOpen, isContactOpen, advance]);

  // ---- profile ----
  const handleViewProfile = (targetUserId) => {
    if (!targetUserId) return;
    if (user && targetUserId === user._id) {
      setViewedProfile(null); setViewedUser(null); setIsProfileOpen(true);
      return;
    }
    const found = allProfiles.find((p) => p.userId?._id === targetUserId);
    if (found) { setViewedProfile(found); setViewedUser(found.userId); setIsProfileOpen(true); }
  };
  const closeProfile = () => { setIsProfileOpen(false); setViewedProfile(null); setViewedUser(null); };

  // ---- create post ----
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewPostMedia(file);
    const reader = new FileReader();
    reader.onloadend = () => setNewPostPreview(reader.result);
    reader.readAsDataURL(file);
  };
  const closeCreate = () => {
    setIsCreateOpen(false); setNewPostBody(''); setNewPostMedia(null); setNewPostPreview('');
  };
  const handleCreatePost = async () => {
    if (!newPostBody.trim() && !newPostMedia) return;
    setCreateLoading(true);
    const formData = new FormData();
    formData.append('body', newPostBody);
    if (newPostMedia) formData.append('media', newPostMedia);
    try {
      const res = await fetch(`${API_BASE_URL}/post`, { method: 'POST', headers: authHeaders(token), body: formData });
      const data = await res.json();
      if (data.success) { closeCreate(); await fetchPosts(); setFeedIndex(0); showToast('Posted to the feed'); }
      else showToast(data.message || 'Failed to create post');
    } catch (err) {
      console.error('Error creating post:', err);
      showToast('Error creating post');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/delete_post`, {
        method: 'POST', headers: authHeaders(token, true),
        body: JSON.stringify({ postId: post._id }),
      });
      const data = await res.json();
      if (data.success) { await fetchPosts(); setFeedIndex(0); showToast('Post deleted'); }
      else showToast(data.message || 'Failed to delete post');
    } catch (err) { console.error('Error deleting post:', err); }
  };

  const handleShare = () => {
    if (!currentPost) return;
    navigator.clipboard?.writeText(`PU-Bay post by ${currentPost.userId?.name}: "${currentPost.body}"`);
    showToast('Post link copied to clipboard');
  };

  // ---- deck geometry ----
  const deckW = isMobile ? Math.min(vw - 32, 400) : 420;
  const deckH = isMobile ? Math.max(430, Math.min(vh - 210, 560)) : Math.min(vh - 180, 560);

  let topTransform = 'none', topTransition = 'transform .42s cubic-bezier(.2,.8,.2,1)', cursor = 'grab';
  if (fly) {
    const dir = fly === 'right' ? 1 : -1;
    topTransform = `translate(${dir * 640}px, ${(drag.y || 0) + 30}px) rotate(${dir * 22}deg)`;
    topTransition = 'transform .32s ease-in'; cursor = 'grabbing';
  } else if (drag.active) {
    topTransform = `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.045}deg)`;
    topTransition = 'none'; cursor = 'grabbing';
  }
  const likeStampOpacity = Math.max(0, Math.min(1, drag.x / 100));
  const skipStampOpacity = Math.max(0, Math.min(1, -drag.x / 100));

  const rootStyle = {
    minHeight: '100vh', backgroundColor: 'var(--paper)',
    backgroundImage: 'radial-gradient(var(--dot) 1.3px, transparent 1.3px)', backgroundSize: '24px 24px',
    color: 'var(--ink)', position: 'relative', overflowX: 'hidden',
  };

  const loggedIn = !!token;
  const viewProfileData = viewedProfile || profile;
  const viewProfileUser = viewedUser || user;

  return (
    <div style={rootStyle}>
      <Navbar
        user={user}
        theme={theme}
        loggedIn={loggedIn}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
        onCreatePostClick={() => setIsCreateOpen(true)}
        onProfileClick={() => { if (isProfileOpen && !viewedProfile) closeProfile(); else { setViewedProfile(null); setViewedUser(null); setIsProfileOpen(true); } }}
        onLogoClick={() => { if (loggedIn) closeProfile(); else setShowAuth(false); }}
        onSignInClick={() => setShowAuth(true)}
      />

      {/* ---------------- LANDING ---------------- */}
      {!loggedIn && !showAuth && (
        <>
          <section style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(36px,7vw,76px) clamp(20px,5vw,40px) 30px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', gap: 48, alignItems: 'center' }}>
            <div className="pu-rise">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', border: '1.5px solid var(--line)', borderRadius: 999, background: 'var(--card)', boxShadow: '2px 2px 0 var(--shadow)', fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} /> Built for Presidency University
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(40px,7.5vw,78px)', lineHeight: 0.97, letterSpacing: '-0.035em', color: 'var(--ink)', margin: '22px 0 0', maxWidth: '13ch' }}>
                Your campus, <span style={{ color: 'var(--accent)' }}>one swipe</span> at a time.
              </h1>
              <p style={{ fontSize: 'clamp(16px,2.1vw,20px)', color: 'var(--soft)', maxWidth: '54ch', margin: '20px 0 0', lineHeight: 1.5 }}>
                PU-Bay is the student network for Presidency University — swipe through what your batch is shipping, grow a résumé-grade profile, and connect across departments.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
                <button onClick={() => setShowAuth(true)} className="pu-press" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: 'var(--accent-ink)', border: '2px solid var(--line)', borderRadius: 13, padding: '14px 24px', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '5px 5px 0 var(--shadow)' }}>
                  Get started <ArrowRight size={18} />
                </button>
                <button onClick={() => setShowAuth(true)} className="pu-press" style={{ background: 'var(--card)', color: 'var(--ink)', border: '2px solid var(--line)', borderRadius: 13, padding: '14px 24px', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '5px 5px 0 var(--shadow)' }}>
                  I have an account
                </button>
              </div>
            </div>

            {!isMobile && (
              <div style={{ position: 'relative', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: 240, height: 220, background: 'var(--card)', border: '2px solid var(--line)', borderRadius: 18, boxShadow: '5px 5px 0 var(--shadow)', transform: 'rotate(-9deg) translateX(-44px)', '--r': '-9deg', animation: 'pu-float 7s ease-in-out infinite', opacity: 0.9 }} />
                <div style={{ position: 'absolute', width: 240, height: 220, background: 'var(--card)', border: '2px solid var(--line)', borderRadius: 18, boxShadow: '5px 5px 0 var(--shadow)', transform: 'rotate(6deg) translateX(40px)', '--r': '6deg', animation: 'pu-float 8s ease-in-out infinite', opacity: 0.95 }} />
                <div style={{ position: 'relative', width: 250, height: 230, background: 'var(--card)', border: '2px solid var(--line)', borderRadius: 18, boxShadow: '6px 6px 0 var(--shadow)', padding: 18, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--butter)', border: '1.5px solid var(--line)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 9, width: '70%', background: 'var(--ink)', borderRadius: 4, opacity: 0.85 }} />
                      <div style={{ height: 7, width: '45%', background: 'var(--border)', borderRadius: 4, marginTop: 6 }} />
                    </div>
                  </div>
                  <div style={{ height: 8, width: '100%', background: 'var(--border)', borderRadius: 4 }} />
                  <div style={{ height: 8, width: '88%', background: 'var(--border)', borderRadius: 4 }} />
                  <div style={{ height: 8, width: '60%', background: 'var(--border)', borderRadius: 4 }} />
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent)', border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-ink)' }}><Heart size={18} fill="currentColor" stroke="none" /></div>
                    <div style={{ flex: 1 }} />
                    <div style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--line)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}><X size={15} /></div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section style={{ maxWidth: 1120, margin: '8px auto 0', padding: '0 clamp(20px,5vw,40px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="pu-lift" style={{ background: 'var(--card)', border: '2px solid var(--line)', borderRadius: 16, boxShadow: '5px 5px 0 var(--shadow)', padding: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--pill)', border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>{f.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--ink)', marginTop: 16, letterSpacing: '-0.01em' }}>{f.title}</div>
                <div style={{ fontSize: 14, color: 'var(--soft)', lineHeight: 1.5, marginTop: 7 }}>{f.body}</div>
              </div>
            ))}
          </section>

          <section style={{ maxWidth: 860, margin: '44px auto 60px', padding: '0 clamp(20px,5vw,40px)' }}>
            <div style={{ background: 'var(--ink)', color: 'var(--paper)', border: '2px solid var(--line)', borderRadius: 20, boxShadow: '7px 7px 0 var(--shadow)', padding: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px,4vw,34px)', letterSpacing: '-0.02em', margin: 0 }}>Ready to join your campus hub?</h2>
              <p style={{ color: 'var(--paper)', opacity: 0.72, fontSize: 15, maxWidth: '46ch', margin: '12px auto 0', lineHeight: 1.5 }}>Sign up with your details and start swiping through what PU is building today.</p>
              <button onClick={() => setShowAuth(true)} className="pu-press" style={{ marginTop: 22, background: 'var(--accent)', color: 'var(--accent-ink)', border: '2px solid var(--paper)', borderRadius: 13, padding: '13px 26px', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>Join PU-Bay</button>
            </div>
          </section>
        </>
      )}

      {/* ---------------- AUTH ---------------- */}
      {!loggedIn && showAuth && (
        <Auth onLoginSuccess={(t) => { setShowAuth(false); setToken(t); showToast('Welcome to PU-Bay'); }} onBackToLanding={() => setShowAuth(false)} />
      )}

      {/* ---------------- APP / FEED ---------------- */}
      {loggedIn && (
        <main
          style={{
            minHeight: 'calc(100vh - 66px)', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'flex-start', padding: isMobile ? '18px 16px 44px' : '28px 24px 60px',
            paddingRight: isProfileOpen && !isMobile ? 500 : undefined, transition: 'padding .4s ease',
          }}
        >
          {len > 0 ? (
            <>
              <div style={{ width: '100%', maxWidth: 440, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, color: 'var(--ink)', letterSpacing: '-0.025em' }}>Campus Feed</div>
                  <div style={{ fontSize: 12.5, color: 'var(--soft)', fontWeight: 600, marginTop: 1 }}>Drag a card · or use ← →</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', border: '1.5px solid var(--line)', borderRadius: 999, padding: '5px 13px', background: 'var(--card)', boxShadow: '2px 2px 0 var(--shadow)' }}>{wrap(feedIndex) + 1} / {len}</div>
              </div>

              <div style={{ position: 'relative', width: deckW, height: deckH, maxWidth: '100%' }}>
                {behind2 && (
                  <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', transform: 'translateY(26px) scale(0.92)', zIndex: 2, opacity: 0.5 }}>
                    <div style={{ height: '100%', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 18, boxShadow: '4px 4px 0 var(--shadow)' }} />
                  </div>
                )}
                {behind1 && (
                  <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', transform: 'translateY(13px) scale(0.96)', zIndex: 3, opacity: 0.82 }}>
                    <div style={{ height: '100%', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 18, boxShadow: '4px 4px 0 var(--shadow)', padding: 18, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar user={behind1.userId} size={38} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{behind1.userId?.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{allProfiles.find((p) => p.userId?._id === behind1.userId?._id)?.currentPost || 'Panjab University'}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 13, fontSize: 14, color: 'var(--soft)', lineHeight: 1.45 }}>{behind1.body.length > 90 ? `${behind1.body.slice(0, 90).trim()}…` : behind1.body}</div>
                    </div>
                  </div>
                )}

                <div onPointerDown={startDrag} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', transform: topTransform, transition: topTransition, cursor, touchAction: 'none', zIndex: 6, willChange: 'transform' }}>
                  <PostCard
                    key={currentPost._id}
                    post={currentPost}
                    token={token}
                    currentUser={user}
                    sentRequests={sentRequests}
                    receivedRequests={receivedRequests}
                    allProfiles={allProfiles}
                    onConnectionUpdated={() => fetchConnections(token)}
                    onViewProfile={handleViewProfile}
                    liked={hasLiked(currentPost)}
                    onLike={() => advance('like')}
                    onSkip={() => advance('skip')}
                    onHeart={() => toggleLike(currentPost)}
                    onShare={handleShare}
                    onDeletePost={handleDeletePost}
                    likeStampOpacity={likeStampOpacity}
                    skipStampOpacity={skipStampOpacity}
                  />
                </div>
              </div>
            </>
          ) : (
            <div style={{ maxWidth: 440, width: '100%', marginTop: 40, background: 'var(--card)', border: '2px solid var(--line)', borderRadius: 18, boxShadow: '6px 6px 0 var(--shadow)', padding: '40px 28px', textAlign: 'center' }}>
              <Sparkles size={40} color="var(--accent)" style={{ margin: '0 auto' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, color: 'var(--ink)', marginTop: 12 }}>You're all caught up</div>
              <div style={{ fontSize: 14, color: 'var(--soft)', marginTop: 6 }}>Be the first to share an update with PU-Bay.</div>
              <button onClick={() => setIsCreateOpen(true)} className="pu-press" style={{ marginTop: 18, background: 'var(--accent)', color: 'var(--accent-ink)', border: '2px solid var(--line)', borderRadius: 12, padding: '11px 20px', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', boxShadow: '4px 4px 0 var(--shadow)' }}>Create a post</button>
            </div>
          )}
        </main>
      )}

      {/* ---------------- PROFILE ASIDE ---------------- */}
      {loggedIn && isProfileOpen && !isMobile && (
        <div onClick={closeProfile} style={{ position: 'fixed', inset: '66px 0 0 0', background: 'var(--backdrop)', zIndex: 240 }} />
      )}
      {loggedIn && viewProfileUser && (
        <aside
          style={isMobile
            ? { position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, width: '100%', zIndex: 250, background: 'var(--paper)', display: isProfileOpen ? 'block' : 'none', overflowY: 'auto', overflowX: 'hidden' }
            : { position: 'fixed', top: 66, right: 0, bottom: 0, width: 460, zIndex: 250, background: 'var(--paper)', borderLeft: '1.5px solid var(--line)', display: isProfileOpen ? 'block' : 'none', overflowY: 'auto', overflowX: 'hidden', boxShadow: '-8px 0 24px rgba(0,0,0,0.12)' }}
        >
          <ProfilePanel
            key={viewProfileUser?._id}
            profile={viewProfileData}
            user={viewProfileUser}
            currentUser={user}
            token={token}
            posts={posts}
            onProfileUpdated={() => { fetchUserData(token); fetchAllProfiles(token); }}
            onClose={closeProfile}
            receivedRequests={receivedRequests}
            sentRequests={sentRequests}
            allProfiles={allProfiles}
            onConnectionUpdated={() => { fetchConnections(token); fetchAllProfiles(token); }}
            onViewProfile={handleViewProfile}
            onToast={showToast}
          />
        </aside>
      )}

      {/* ---------------- FOOTER ---------------- */}
      {(!loggedIn ? !showAuth : true) && (
        <footer style={{ borderTop: '1.5px solid var(--border)', padding: '18px clamp(16px,4vw,40px)', background: 'color-mix(in srgb, var(--paper) 84%, transparent)' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--soft)', fontWeight: 600 }}>
            <span>© {new Date().getFullYear()} PU-Bay · A Presidency University student network</span>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <button onClick={() => setIsPrivacyOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5 }}>Privacy</button>
              <button onClick={() => setIsContactOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5 }}>Contact</button>
            </div>
          </div>
        </footer>
      )}

      {/* ---------------- CREATE POST MODAL ---------------- */}
      {isCreateOpen && (
        <Modal onClose={closeCreate} maxWidth={480}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid var(--border)', paddingBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Create a post</div>
            <CloseBtn onClick={closeCreate} />
          </div>
          <div style={{ display: 'flex', gap: 11, marginTop: 14 }}>
            <Avatar user={user} size={42} />
            <textarea
              className="pu-input"
              value={newPostBody}
              onChange={(e) => setNewPostBody(e.target.value)}
              placeholder={`What's on your mind, ${user?.name?.split(' ')[0] || 'friend'}?`}
              style={{ flex: 1, minHeight: 120, resize: 'vertical', padding: '11px 13px', border: '1.5px solid var(--border)', borderRadius: 12, background: 'var(--pill)', color: 'var(--ink)', fontSize: 15, fontFamily: 'inherit', outline: 'none', lineHeight: 1.5 }}
            />
          </div>
          {newPostPreview && (
            <div style={{ position: 'relative', marginTop: 12, border: '1.5px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--pill)' }}>
              {newPostMedia?.type?.startsWith('video/')
                ? <video src={newPostPreview} controls style={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'contain' }} />
                : <img src={newPostPreview} alt="Preview" style={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'cover' }} />}
              <button onClick={() => { setNewPostMedia(null); setNewPostPreview(''); }} style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0 var(--shadow)' }}><X size={15} /></button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <label className="pu-bd-accent" style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--card)', color: 'var(--ink)', border: '1.5px solid var(--line)', borderRadius: 11, padding: '9px 14px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', transition: 'border-color .15s, color .15s' }}>
              <input type="file" accept="image/*,video/*" onChange={handleMediaChange} style={{ display: 'none' }} />
              <ImageIcon size={16} />Add media
            </label>
            <button onClick={handleCreatePost} disabled={createLoading || (!newPostBody.trim() && !newPostMedia)} className="pu-press" style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: '2px solid var(--line)', borderRadius: 11, padding: '11px 22px', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', boxShadow: '3px 3px 0 var(--shadow)', opacity: createLoading ? 0.7 : 1 }}>{createLoading ? 'Posting…' : 'Post'}</button>
          </div>
        </Modal>
      )}

      {/* ---------------- PRIVACY MODAL ---------------- */}
      {isPrivacyOpen && (
        <Modal onClose={() => setIsPrivacyOpen(false)} maxWidth={460}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid var(--border)', paddingBottom: 12, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Privacy policy</div>
            <CloseBtn onClick={() => setIsPrivacyOpen(false)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 13.5 }}>We keep your privacy simple and transparent.</div>
            {[
              ['Secure authentication', 'Passwords are hashed with bcrypt and never stored in plain text. Sessions use temporary tokens.'],
              ['Data you control', 'We only store what you submit — profile, posts, comments and connections. No location or behavioural tracking.'],
              ['Yours to remove', 'Edit your profile or delete posts anytime. We never sell your data.'],
            ].map(([t, b]) => (
              <div key={t}><div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink)' }}>{t}</div><div style={{ fontSize: 13, color: 'var(--soft)', lineHeight: 1.45, marginTop: 2 }}>{b}</div></div>
            ))}
          </div>
        </Modal>
      )}

      {/* ---------------- CONTACT MODAL ---------------- */}
      {isContactOpen && (
        <Modal onClose={() => setIsContactOpen(false)} maxWidth={400}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid var(--border)', paddingBottom: 12, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Contact</div>
            <CloseBtn onClick={() => setIsContactOpen(false)} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--soft)', lineHeight: 1.45, marginBottom: 14 }}>Questions, ideas or want to collaborate? Reach out:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <ContactLink href="mailto:shrivastav.work@gmail.com" icon={<Mail size={18} color="var(--accent)" />} label="Email" value="shrivastav.work@gmail.com" />
            <ContactLink href="https://www.linkedin.com/in/shrivastavakash/" icon={<LinkedInIcon />} label="LinkedIn" value="shrivastavakash" external />
            <ContactLink href="https://x.com/_akashrivastav_" icon={<TwitterX />} label="X (Twitter)" value="@_akashrivastav_" external />
          </div>
        </Modal>
      )}

      {/* ---------------- TOAST ---------------- */}
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, zIndex: 400, transform: 'translateX(-50%)', background: 'var(--ink)', color: 'var(--paper)', border: '1.5px solid var(--line)', borderRadius: 12, padding: '11px 20px', fontWeight: 700, fontSize: 14, boxShadow: '4px 4px 0 var(--shadow)', animation: 'pu-toast .25s ease both' }}>{toast}</div>
      )}
    </div>
  );
}

function Modal({ children, onClose, maxWidth }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'var(--backdrop)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div onClick={(e) => e.stopPropagation()} className="pu-rise" style={{ width: '100%', maxWidth, background: 'var(--card)', border: '2px solid var(--line)', borderRadius: 18, boxShadow: '8px 8px 0 var(--shadow)', padding: 22, maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

function CloseBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
  );
}

function ContactLink({ href, icon, label, value, external }) {
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="pu-bd-accent" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', border: '1.5px solid var(--border)', borderRadius: 11, background: 'var(--pill)', textDecoration: 'none', color: 'var(--ink)', transition: 'border-color .15s' }}>
      <span style={{ display: 'flex' }}>{icon}</span>
      <div><div style={{ fontSize: 11, color: 'var(--soft)', fontWeight: 700 }}>{label}</div><div style={{ fontSize: 13.5, fontWeight: 600 }}>{value}</div></div>
    </a>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="#0077b5" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function TwitterX() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--ink)" style={{ display: 'block' }}>
      <path d="M18.2 2.2h3.3l-7.2 8.3 8.5 11.3H16l-5.2-6.8L4.9 22.2H1.6l7.7-8.8L1.2 2.2H8l4.7 6.2zm-1.2 17.5h1.8L7 4.1H5.1z" />
    </svg>
  );
}
