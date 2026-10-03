import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, setSessionExpiredHandler } from '@/lib/api';
import { useLoader } from '@/lib/use-loader';
import { AuthContext, DataContext } from './session';

// Earlier builds kept the JWT in localStorage; make sure no copy lingers.
try {
  localStorage.removeItem('token');
} catch {
  // Storage blocked: nothing to clean up.
}

export function SessionProvider({ children }) {
  // Bumped on login, logout and expiry. Remounting the data layer drops every
  // trace of the previous session and asks the API who is signed in now.
  const [generation, setGeneration] = useState(0);
  // Distinguishes "signed out on purpose" (go to the landing page) from
  // "never signed in / session expired" (go to the login form).
  const [signedOut, setSignedOut] = useState(false);

  const renew = useCallback(() => setGeneration((g) => g + 1), []);
  const login = useCallback(() => { setSignedOut(false); renew(); }, [renew]);
  const logout = useCallback(async () => {
    try {
      await api('/logout', { method: 'POST' });
    } finally {
      setSignedOut(true);
      renew();
    }
  }, [renew]);

  return (
    <DataProvider key={generation} signedOut={signedOut} login={login} logout={logout} expire={renew}>
      {children}
    </DataProvider>
  );
}

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

function sessionStatus(me) {
  if (me.status === 'ready') return 'authenticated';
  if (me.status === 'loading') return 'checking';
  return me.error?.status === 401 ? 'anonymous' : 'error';
}

function DataProvider({ signedOut, login, logout, expire, children }) {
  // The cookie is invisible to scripts, so "who am I" is the session check.
  const loadMe = useCallback(() => api('/get_user_and_profile'), []);
  const loadProfiles = useCallback(() => api('/user/get_all_users'), []);
  const loadRequests = useCallback(async () => {
    const [received, sent] = await Promise.all([
      api('/user/user_connection_request'),
      api('/user/get_connection_request'),
    ]);
    return { received, sent };
  }, []);
  const loadPosts = useCallback(async () => (await api('/get_all_posts')).sort(byNewest), []);

  const me = useLoader(loadMe);
  const status = sessionStatus(me);
  const signedIn = status === 'authenticated';
  const profiles = useLoader(loadProfiles, signedIn);
  const requests = useLoader(loadRequests, signedIn);
  const posts = useLoader(loadPosts);
  const [feedIndex, setFeedIndex] = useState(0);

  // Any later 401 (cookie expired mid-session) ends the session everywhere.
  useEffect(() => {
    if (!signedIn) return undefined;
    setSessionExpiredHandler(expire);
    return () => setSessionExpiredHandler(null);
  }, [signedIn, expire]);

  const meId = me.data?.user?._id;
  const sent = requests.data?.sent;
  const received = requests.data?.received;
  const setPosts = posts.setData;
  const reloadRequests = requests.reload;

  const profileByUserId = useMemo(() => {
    const map = new Map();
    for (const p of profiles.data || []) if (p.userId?._id) map.set(p.userId._id, p);
    return map;
  }, [profiles.data]);

  const setLiked = useCallback((postId, liked) => {
    setPosts((list) => list?.map((p) => {
      if (p._id !== postId) return p;
      const likedBy = (p.likedBy || []).filter((id) => id !== meId);
      if (liked) likedBy.push(meId);
      return { ...p, likedBy, likes: likedBy.length };
    }));
  }, [setPosts, meId]);

  const setLike = useCallback(async (post, liked) => {
    const was = (post.likedBy || []).includes(meId);
    if (!meId || was === liked) return;
    setLiked(post._id, liked);
    try {
      await api(liked ? '/increment_likes' : '/decrement_likes', { method: 'POST', body: { postId: post._id } });
    } catch (err) {
      setLiked(post._id, was);
      throw err;
    }
  }, [meId, setLiked]);

  const sendRequest = useCallback(async (receiverId) => {
    const result = await api('/user/send_connection_request', { method: 'POST', body: { receiverId } });
    await reloadRequests();
    return result;
  }, [reloadRequests]);

  const respondRequest = useCallback(async (requestId, accept) => {
    await api('/user/accept_connection_request', {
      method: 'POST',
      body: { connectionId: requestId, action_type: accept ? 'accept' : 'reject' },
    });
    await reloadRequests();
  }, [reloadRequests]);

  const auth = useMemo(() => ({ status, signedOut, login, logout, retry: me.reload }), [status, signedOut, login, logout, me.reload]);

  const value = useMemo(() => ({
    meId,
    me,
    profiles,
    requests,
    posts,
    sent: sent || [],
    received: received || [],
    profileByUserId,
    feedIndex,
    setFeedIndex,
    setLike,
    sendRequest,
    respondRequest,
  }), [meId, me, profiles, requests, posts, sent, received, profileByUserId, feedIndex, setLike, sendRequest, respondRequest]);

  return (
    <AuthContext value={auth}>
      <DataContext value={value}>{children}</DataContext>
    </AuthContext>
  );
}
