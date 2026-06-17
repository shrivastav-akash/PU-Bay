import { Sun, Moon, LogOut, PlusSquare, User, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Navbar({ 
  user, 
  theme, 
  toggleTheme, 
  onLogout, 
  onProfileClick, 
  onCreatePostClick,
  onLogoClick,
  onLoginClick
}) {
  const avatarUrl = user?.profilePicture && user.profilePicture !== 'default.jpg'
    ? `${API_BASE_URL}/${user.profilePicture}`
    : null;

  return (
    <nav className="navbar">
      <div className="logo-container" onClick={onLogoClick || (() => window.location.reload())}>
        <Sparkles size={24} style={{ fill: 'currentColor' }} />
        <span>PU-Bay</span>
      </div>

      <div className="nav-actions">
        {user && (
          <>
            <button 
              className="btn btn-secondary" 
              onClick={onCreatePostClick}
              style={{ padding: '0.5rem 0.75rem' }}
              title="Create Post"
            >
              <PlusSquare size={20} />
              <span style={{ display: 'none' }} className="desktop-only">Post</span>
            </button>

            <div className="profile-greeting" onClick={onProfileClick}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={user.name} 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid var(--accent-color)'
                  }} 
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--input-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid var(--accent-color)'
                }}>
                  <User size={16} />
                </div>
              )}
              <span className="desktop-only" style={{ fontWeight: 600 }}>O hi, {user.name.split(' ')[0]}</span>
            </div>
          </>
        )}

        {!user && onLoginClick && (
          <button 
            className="btn btn-primary" 
            onClick={onLoginClick}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            Sign In
          </button>
        )}

        <button 
          className="btn btn-secondary" 
          onClick={toggleTheme}
          style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user && (
          <button 
            className="btn btn-secondary" 
            onClick={onLogout}
            style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, color: 'var(--danger-color)' }}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>

      <style>{`
        @media (min-width: 769px) {
          .desktop-only {
            display: inline !important;
          }
        }
      `}</style>
    </nav>
  );
}
