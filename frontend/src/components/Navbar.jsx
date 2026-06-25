import { Sun, Moon, LogOut, Plus } from 'lucide-react';
import Avatar from './Avatar';

export default function Navbar({
  user,
  theme,
  loggedIn,
  toggleTheme,
  onLogout,
  onProfileClick,
  onCreatePostClick,
  onLogoClick,
  onSignInClick,
}) {
  const isDark = theme === 'dark';
  const firstName = user?.name ? user.name.split(' ')[0] : '';

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        height: 66,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(16px,4vw,40px)',
        background: 'color-mix(in srgb, var(--paper) 84%, transparent)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1.5px solid var(--border)',
      }}
    >
      <div onClick={onLogoClick} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: 9, background: 'var(--accent)',
            border: '1.5px solid var(--line)', boxShadow: '2px 2px 0 var(--shadow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
          }}
        >
          P
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
          PU<span style={{ color: 'var(--accent)' }}>·</span>Bay
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        {loggedIn && (
          <>
            <button
              onClick={onCreatePostClick}
              className="pu-press"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'var(--ink)', color: 'var(--paper)',
                border: '1.5px solid var(--line)', borderRadius: 10, padding: '8px 13px', fontWeight: 700,
                fontSize: 13.5, cursor: 'pointer', boxShadow: '2px 2px 0 var(--shadow)',
              }}
            >
              <Plus size={15} /><span>Post</span>
            </button>
            <div
              onClick={onProfileClick}
              className="pu-bd"
              style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 10px 4px 4px',
                border: '1.5px solid var(--border)', borderRadius: 999, background: 'var(--card)',
              }}
            >
              <Avatar user={user} size={30} />
              <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{firstName}</span>
            </div>
          </>
        )}

        {!loggedIn && (
          <button
            onClick={onSignInClick}
            className="pu-press"
            style={{
              background: 'var(--accent)', color: 'var(--accent-ink)', border: '1.5px solid var(--line)',
              borderRadius: 10, padding: '9px 16px', fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
              boxShadow: '2px 2px 0 var(--shadow)',
            }}
          >
            Sign in
          </button>
        )}

        <button
          onClick={toggleTheme}
          title="Toggle theme"
          className="pu-bd"
          style={{
            width: 38, height: 38, borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--card)',
            color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {loggedIn && (
          <button
            onClick={onLogout}
            title="Log out"
            className="pu-bd-danger"
            style={{
              width: 38, height: 38, borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--card)',
              color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color .15s ease',
            }}
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
    </nav>
  );
}
