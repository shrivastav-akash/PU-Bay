import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, readToken, writeToken } from '@/lib/api';
import { useLoader } from '@/lib/use-loader';
import { AuthContext, DataContext } from './session';

export function SessionProvider({ children }) {
  const [token, setToken] = useState(readToken);
  // Distinguishes "signed out on purpose" (go to the landing page) from
  // "never signed in / token expired" (go to the login form).
  const [signedOut, setSignedOut] = useState(false);
  const login = useCallback((t) => { writeToken(t); setToken(t); setSignedOut(false); }, []);
  const logout = useCallback(() => { writeToken(''); setToken(''); setSignedOut(true); }, []);
  const expire = useCallback(() => { writeToken(''); setToken(''); }, []);
  const auth = useMemo(() => ({ token, signedOut, login, logout }), [token, signedOut, login, logout]);

  // Keyed by token: signing in or out remounts the data layer, so no state
  // from the previous account can leak into the next one.
  return (
    <AuthContext value={auth}>
      <DataProvider key={token || 'anonymous'} token={token} logout={expire}>
        {children}
      </DataProvider>
    </AuthContext>
  );
}

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

function DataProvider({ token, logout, children }) {
  const signedIn = Boolean(token);

  const loadMe = useCallback(() => api('/get_user_and_profile', { token }), [token]);
  const loadProfiles = useCallback(() => api('/user/get_all_users', { token }), [token]);
  const loadRequests = useCallback(async () => {
    const [received, sent] = await Promise.all([
      api('/user/user_connection_request', { token }),
      api('/user/get_connection_request', { token }),
    ]);
    return { received, sent };
  }, [token]);
  const loadPosts = useCallback(async () => (await api('/get_all_posts')).sort(byNewest), []);

  const me = useLoader(loadMe, signedIn);
  const profiles = useLoader(loadProfiles, signedIn);
  const requests = useLoader(loadRequests, signedIn);
  const posts = useLoader(loadPosts);
  const [feedIndex, setFeedIndex] = useState(0);

  // A rejected token (expired, or the user was removed) ends the session.
  useEffect(() => {
    if (me.error?.status === 401) logout();
  }, [me.error, logout]);

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
      await api(liked ? '/increment_likes' : '/decrement_likes', { method: 'POST', body: { postId: post._id }, token });
    } catch (err) {
      setLiked(post._id, was);
      throw err;
    }
  }, [meId, setLiked, token]);

  const sendRequest = useCallback(async (receiverId) => {
    await api('/user/send_connection_request', { method: 'POST', body: { receiverId }, token });
    await reloadRequests();
  }, [token, reloadRequests]);

  const respondRequest = useCallback(async (requestId, accept) => {
    await api('/user/accept_connection_request', {
      method: 'POST',
      body: { connectionId: requestId, action_type: accept ? 'accept' : 'reject' },
      token,
    });
    await reloadRequests();
  }, [token, reloadRequests]);

  const value = useMemo(() => ({
    token,
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
  }), [token, meId, me, profiles, requests, posts, sent, received, profileByUserId, feedIndex, setLike, sendRequest, respondRequest]);

  return <DataContext value={value}>{children}</DataContext>;
}
