/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import PostCard from './components/PostCard';
import ProfilePanel from './components/ProfilePanel';
import { API_BASE_URL } from './config';
import { Sparkles, Plus, X, Image as ImageIcon, Mail, Layers, FileText, Users, ChevronRight } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [posts, setPosts] = useState([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState('right');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);
  
  // For managing connections and suggestions
  const [allProfiles, setAllProfiles] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  // Create Post state
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [newPostMediaPreview, setNewPostMediaPreview] = useState('');
  const [createPostLoading, setCreatePostLoading] = useState(false);

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Touch Swipe Refs for Mobile
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const minSwipeDistance = 50;
    
    if (distance > minSwipeDistance) {
      // Swipe Left -> Next Post
      handleNextPost();
    } else if (distance < -minSwipeDistance) {
      // Swipe Right -> Prev Post
      handlePrevPost();
    }
    
    touchStartRef.current = 0;
    touchEndRef.current = 0;
  };

  const handleNextPost = useCallback(() => {
    if (posts.length > 0) {
      setSwipeDirection('right');
      setCurrentPostIndex((prevIndex) => (prevIndex + 1) % posts.length);
    }
  }, [posts.length]);

  const handlePrevPost = useCallback(() => {
    if (posts.length > 0) {
      setSwipeDirection('left');
      setCurrentPostIndex((prevIndex) => (prevIndex - 1 + posts.length) % posts.length);
    }
  }, [posts.length]);

  // Sync theme with DOM attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setProfile(null);
    setIsProfileOpen(false);
    setViewedProfile(null);
    setViewedUser(null);
  }, []);

  // Fetch all core user and social data
  const fetchUserData = useCallback(async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get_user_and_profile?token=${authToken}`);
      const data = await response.json();
      if (data.success) {
        setUser(data.data.user);
        setProfile(data.data.profile);
      } else {
        // Token might be invalid/expired
        handleLogout();
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  }, [handleLogout]);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get_all_posts`);
      const data = await response.json();
      if (data.success) {
        // Sort posts by newest first
        const sorted = data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(sorted);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  }, []);

  const fetchAllProfiles = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/get_all_users`);
      const data = await response.json();
      if (data.success) {
        setAllProfiles(data.data);
      }
    } catch (err) {
      console.error("Error fetching all profiles:", err);
    }
  }, []);

  const fetchConnections = useCallback(async (authToken) => {
    try {
      // Fetch received requests
      const receivedRes = await fetch(`${API_BASE_URL}/user/user_connection_request?token=${authToken}`);
      const receivedData = await receivedRes.json();
      if (receivedData.success) {
        setReceivedRequests(receivedData.data);
      }

      // Fetch sent requests
      const sentRes = await fetch(`${API_BASE_URL}/user/get_connection_request?token=${authToken}`);
      const sentData = await sentRes.json();
      if (sentData.success) {
        setSentRequests(sentData.data);
      }
    } catch (err) {
      console.error("Error fetching connections:", err);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserData(token);
      fetchConnections(token);
      fetchAllProfiles();
    }
    fetchPosts();
  }, [token, fetchUserData, fetchConnections, fetchAllProfiles, fetchPosts]);

  // Keyboard navigation for post transitions
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (active && (
        active.tagName === 'INPUT' || 
        active.tagName === 'TEXTAREA' || 
        active.isContentEditable
      )) {
        return;
      }
      if (e.key === 'ArrowRight') {
        handleNextPost();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPost();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [posts.length, handleNextPost, handlePrevPost]);

  // Forward scroll/wheel events from the feed viewport to the profile panel if content fits
  useEffect(() => {
    if (!isProfileOpen) return;
    
    const feedViewport = document.querySelector('.feed-viewport');
    const profilePanel = document.querySelector('.profile-panel-wrapper');
    
    if (!feedViewport || !profilePanel) return;

    const handleWheel = (e) => {
      const hasOverflow = feedViewport.scrollHeight > feedViewport.clientHeight;
      if (!hasOverflow) {
        profilePanel.scrollTop += e.deltaY;
      }
    };

    feedViewport.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      feedViewport.removeEventListener('wheel', handleWheel);
    };
  }, [posts, isProfileOpen, viewedProfile, viewedUser]);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };



  const handleViewProfile = (targetUserId) => {
    if (!targetUserId) return;
    if (user && targetUserId === user._id) {
      setViewedProfile(null);
      setViewedUser(null);
      setIsProfileOpen(true);
      return;
    }
    const foundProfile = allProfiles.find(p => p.userId?._id === targetUserId);
    if (foundProfile) {
      setViewedProfile(foundProfile);
      setViewedUser(foundProfile.userId);
      setIsProfileOpen(true);
    } else {
      console.warn("Profile not found for userId:", targetUserId);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostBody.trim() && !newPostMedia) return;

    setCreatePostLoading(true);
    const formData = new FormData();
    formData.append('token', token);
    formData.append('body', newPostBody);
    if (newPostMedia) {
      formData.append('media', newPostMedia);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/post`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setNewPostBody('');
        setNewPostMedia(null);
        setNewPostMediaPreview('');
        setIsCreatePostOpen(false);
        fetchPosts();
        setCurrentPostIndex(0); // View the newest post
      } else {
        alert(data.message || 'Failed to create post');
      }
    } catch (err) {
      console.error("Error creating post:", err);
      alert('Error creating post');
    } finally {
      setCreatePostLoading(false);
    }
  };

  const handlePostLiked = (postId, newLikes) => {
    setPosts(prevPosts => 
      prevPosts.map(p => p._id === postId ? { ...p, likes: newLikes } : p)
    );
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPostMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderLandingPage = () => {
    return (
      <div style={{ paddingBottom: '4rem' }}>
        {/* Hero Section */}
        <section className="landing-hero">
          <h1 className="landing-title">
            Connect. Share. Shine.
          </h1>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Welcome to PU-Bay
          </h2>
          <p className="landing-subtitle">
            The premier campus network designed exclusively for Panjab University students. 
            Build your professional identity, showcase updates, send connections, and explore 
            what's happening across departments in a swipeable, modern experience.
          </p>
          <div className="landing-actions">
            <button className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowAuth(true)}>
              Get Started <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="landing-features">
          <div className="glow-card feature-card">
            <div className="feature-icon-wrapper">
              <Layers size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>
              Swipeable Feed
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Explore posts and student updates using our Tinder-like swiping interface. Swiftly navigate through thoughts, projects, and announcements.
            </p>
          </div>

          <div className="glow-card feature-card">
            <div className="feature-icon-wrapper">
              <FileText size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>
              Professional Profiles
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Build and customize a professional LinkedIn-style resume directly on your profile. Share your skills, education, and career aspirations.
            </p>
          </div>

          <div className="glow-card feature-card">
            <div className="feature-icon-wrapper">
              <Users size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>
              Campus Connections
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Send and accept connection requests to network with peers, find project partners, and connect across different departments.
            </p>
          </div>
        </section>

        {/* Call to Action */}
        <section className="landing-cta glow-card">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
            Ready to Join Your Campus Hub?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            Sign up now using your credentials to connect with peers and start sharing your updates.
          </p>
          <button className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }} onClick={() => setShowAuth(true)}>
            Join PU-Bay
          </button>
        </section>
      </div>
    );
  };

  const currentPost = posts[currentPostIndex];

  return (
    <div className="app-container">
      <Navbar 
        user={user} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onLogout={handleLogout}
        onProfileClick={() => {
          if (!isProfileOpen) {
            setViewedProfile(null);
            setViewedUser(null);
            setIsProfileOpen(true);
          } else if (viewedProfile !== null) {
            setViewedProfile(null);
            setViewedUser(null);
          } else {
            setIsProfileOpen(false);
          }
        }}
        onCreatePostClick={() => setIsCreatePostOpen(true)}
        onLogoClick={() => {
          if (!token) setShowAuth(false);
          else window.location.reload();
        }}
        onLoginClick={() => setShowAuth(true)}
      />

      {!token ? (
        showAuth ? (
          <Auth onLoginSuccess={handleLoginSuccess} onBackToLanding={() => setShowAuth(false)} />
        ) : (
          renderLandingPage()
        )
      ) : (
        <main className={`main-content ${isProfileOpen ? 'split-layout' : ''}`}>
          
          {/* Feed Viewport (Left Side / Centered) */}
          <div 
            className="feed-viewport"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {posts.length > 1 && (
              <button 
                className="nav-arrow left" 
                onClick={handlePrevPost}
                title="Previous Post"
              >
                ←
              </button>
            )}

            <div className="feed-card-wrapper">
              {posts.length > 0 && currentPostIndex >= 0 && currentPostIndex < posts.length ? (
                <PostCard 
                  key={currentPost?._id}
                  post={currentPost}
                  token={token}
                  currentUser={user}
                  onPostDeleted={fetchPosts}
                  sentRequests={sentRequests}
                  receivedRequests={receivedRequests}
                  allProfiles={allProfiles}
                  onConnectionUpdated={() => fetchConnections(token)}
                  swipeDirection={swipeDirection}
                  onViewProfile={handleViewProfile}
                  onPostLiked={handlePostLiked}
                />
              ) : (
                <div className="glow-card pulse-border" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                  <Sparkles size={48} color="var(--accent-color)" style={{ margin: '0 auto 1.5rem auto' }} />
                  <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>No Posts Yet</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Be the first one to share an update with the PU-Bay community!</p>
                  <button className="btn btn-primary" onClick={() => setIsCreatePostOpen(true)}>
                    <Plus size={18} /> Create a Post
                  </button>
                </div>
              )}
            </div>

            {posts.length > 1 && (
              <button 
                className="nav-arrow right" 
                onClick={handleNextPost}
                title="Next Post"
              >
                →
              </button>
            )}
          </div>

          {/* Profile Details Panel (Right Side / Fullscreen Overlay on Mobile) */}
          <div className={`profile-panel-wrapper ${isProfileOpen ? 'open' : 'closed'}`}>
            {(viewedProfile || profile) && (
              <ProfilePanel 
                key={viewedProfile?._id || profile?._id}
                profile={viewedProfile || profile}
                user={viewedUser || user}
                currentUser={user}
                token={token}
                posts={posts}
                onProfileUpdated={() => {
                  fetchUserData(token);
                  fetchAllProfiles();
                }}
                onClose={() => setIsProfileOpen(false)}
                receivedRequests={receivedRequests}
                sentRequests={sentRequests}
                allProfiles={allProfiles}
                onConnectionUpdated={() => {
                  fetchConnections(token);
                  fetchAllProfiles();
                }}
                onViewProfile={handleViewProfile}
              />
            )}
          </div>
        </main>
      )}

      {/* Create Post Modal Overlay */}
      {isCreatePostOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="glow-card" style={{ maxWidth: '500px', animation: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>Create Post</h3>
              <button 
                onClick={() => {
                  setIsCreatePostOpen(false);
                  setNewPostBody('');
                  setNewPostMedia(null);
                  setNewPostMediaPreview('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <textarea
                placeholder="What's on your mind? Share an update..."
                className="input-field textarea-field"
                value={newPostBody}
                onChange={(e) => setNewPostBody(e.target.value)}
                required
              />

              {newPostMediaPreview && (
                <div style={{ 
                  position: 'relative', 
                  borderRadius: 'var(--border-radius-md)', 
                  overflow: 'hidden', 
                  border: '1px solid var(--border-color)', 
                  maxHeight: '300px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)'
                }}>
                  {newPostMedia && newPostMedia.type.startsWith('video/') ? (
                    <video 
                      src={newPostMediaPreview} 
                      controls 
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }} 
                    />
                  ) : (
                    <img 
                      src={newPostMediaPreview} 
                      alt="Preview" 
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }} 
                    />
                  )}
                  <button 
                    type="button" 
                    onClick={() => {
                      setNewPostMedia(null);
                      setNewPostMediaPreview('');
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '0.5rem 1rem' }}>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    style={{ display: 'none' }} 
                    onChange={handleMediaChange} 
                  />
                  <ImageIcon size={18} /> Add Media
                </label>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={createPostLoading || (!newPostBody.trim() && !newPostMedia)}
                >
                  {createPostLoading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>&copy; {new Date().getFullYear()} PU-Bay. All rights reserved.</span>
          <div className="footer-links">
            <button className="link-btn" onClick={() => setIsPrivacyOpen(true)}>Privacy Policy</button>
            <span className="separator">|</span>
            <button className="link-btn" onClick={() => setIsContactOpen(true)}>Contact Info</button>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {isPrivacyOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="glow-card" style={{ maxWidth: '500px', animation: 'none', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>Privacy Policy</h3>
              <button 
                onClick={() => setIsPrivacyOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>
              <p style={{ fontWeight: 600, color: 'var(--accent-color)' }}>At PU-Bay, we keep your privacy simple and transparent:</p>
              
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.15rem' }}>1. Secure Authentication</h4>
                <p style={{ color: 'var(--text-secondary)' }}>We protect your password by hashing it with bcrypt so it is never readable. We use temporary tokens to keep you logged in securely.</p>
              </div>

              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.15rem' }}>2. Data Collection & Usage</h4>
                <p style={{ color: 'var(--text-secondary)' }}>We only store the info you choose to submit: profile details, work history, posts, comments, and connection requests. We do not track your location or usage patterns.</p>
              </div>

              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.15rem' }}>3. Data Control</h4>
                <p style={{ color: 'var(--text-secondary)' }}>All data resides safely on our university campus network servers. You can edit your profile or delete your posts at any time. We never share or sell your data.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Info Modal */}
      {isContactOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="glow-card" style={{ maxWidth: '400px', animation: 'none', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>Contact Info</h3>
              <button 
                onClick={() => setIsContactOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem', lineHeight: '1.4' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Have questions, suggestions, or want to collaborate? Connect with me directly:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a 
                  href="mailto:shrivastav.work@gmail.com" 
                  className="contact-item-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--border-radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  <Mail size={18} color="#ef4444" />
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</span>
                    shrivastav.work@gmail.com
                  </div>
                </a>

                <a 
                  href="https://www.linkedin.com/in/shrivastavakash/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="contact-item-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--border-radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    width="18" 
                    height="18" 
                    stroke="#0077b5" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LinkedIn</span>
                    shrivastavakash
                  </div>
                </a>

                <a 
                  href="https://x.com/_akashrivastav_" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="contact-item-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--border-radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    width="18" 
                    height="18" 
                    fill="#1da1f2"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>X (Twitter)</span>
                    @_akashrivastav_
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
