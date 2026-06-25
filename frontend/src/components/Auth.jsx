import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { ArrowRight } from 'lucide-react';

const inputStyle = {
  width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 11,
  background: 'var(--pill)', color: 'var(--ink)', fontSize: 15, fontFamily: 'inherit', outline: 'none',
};

export default function Auth({ onLoginSuccess, onBackToLanding }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/login' : '/register';
    const payload = isLogin ? { email, password } : { name, username, email, password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Something went wrong');
      }
      if (isLogin) {
        const token = data.data.token;
        localStorage.setItem('token', token);
        onLoginSuccess(token);
      } else {
        setIsLogin(true);
        setError('Account created — sign in to continue.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      style={{ minHeight: 'calc(100vh - 66px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}
    >
      <div
        className="pu-rise"
        style={{
          width: '100%', maxWidth: 418, background: 'var(--card)', border: '2px solid var(--line)',
          borderRadius: 20, boxShadow: '8px 8px 0 var(--shadow)', padding: 30,
        }}
      >
        <button
          type="button"
          onClick={onBackToLanding}
          className="pu-hov-accent"
          style={{
            background: 'none', border: 'none', color: 'var(--soft)', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          ← Back
        </button>

        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 27, color: 'var(--ink)', marginTop: 14, letterSpacing: '-0.02em' }}>
          {isLogin ? 'Welcome back' : 'Join PU-Bay'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--soft)', marginTop: 4 }}>
          {isLogin ? 'Sign in to connect with fellow PU students.' : 'Create an account to get started.'}
        </div>

        {error && (
          <div
            style={{
              marginTop: 16, background: 'var(--good-bg)', border: '1.5px solid var(--border)',
              color: 'var(--ink)', padding: '10px 13px', borderRadius: 11, fontSize: 13, fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 22 }}>
          {!isLogin && (
            <>
              <input className="pu-input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
              <input className="pu-input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
            </>
          )}
          <input className="pu-input" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          <input className="pu-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />

          <button
            type="submit"
            disabled={loading}
            className="pu-press"
            style={{
              marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'var(--accent)', color: 'var(--accent-ink)', border: '2px solid var(--line)',
              borderRadius: 12, padding: 13, fontWeight: 800, fontSize: 15.5, cursor: 'pointer',
              boxShadow: '4px 4px 0 var(--shadow)', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--soft)', marginTop: 18 }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ color: 'var(--accent)', fontWeight: 800, cursor: 'pointer' }}
          >
            {isLogin ? 'Register' : 'Sign in'}
          </span>
        </div>
      </div>
    </section>
  );
}
