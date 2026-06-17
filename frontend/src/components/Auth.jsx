import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { Mail, Lock, User, AtSign, ArrowRight, Sparkles } from 'lucide-react';

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
    const payload = isLogin 
      ? { email, password } 
      : { name, username, email, password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        // After successful registration, toggle to login screen
        setIsLogin(true);
        setError('');
        alert('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 70px)',
      padding: '2rem',
      background: 'radial-gradient(circle at top left, var(--accent-glow) 0%, transparent 60%)'
    }}>
      <div className="glow-card pulse-border" style={{ maxWidth: '420px', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
        {onBackToLanding && (
          <button 
            type="button" 
            onClick={onBackToLanding}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              fontSize: '0.85rem',
              fontWeight: 500,
              padding: '0 0 1rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'color var(--transition-smooth)'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent-color)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
          >
            &larr; Back to Landing Page
          </button>
        )}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ 
            fontFamily: 'var(--font-heading)', 
            fontWeight: 800, 
            fontSize: '2rem',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={28} color="var(--accent-color)" />
            {isLogin ? 'Welcome Back' : 'Join PU-Bay'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isLogin ? 'Login to connect with fellow PU students' : 'Create an account to get started'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--danger-color)',
            color: 'var(--danger-color)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '0.85rem',
            fontWeight: 500,
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && (
            <>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)'
                }} />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="input-field"
                  style={{ paddingLeft: '2.75rem' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ position: 'relative' }}>
                <AtSign size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)'
                }} />
                <input
                  type="text"
                  placeholder="Username"
                  className="input-field"
                  style={{ paddingLeft: '2.75rem' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }} />
            <input
              type="email"
              placeholder="Email address"
              className="input-field"
              style={{ paddingLeft: '2.75rem' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }} />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              style={{ paddingLeft: '2.75rem' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{ 
              color: 'var(--accent-color)', 
              fontWeight: 600, 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </div>
      </div>
    </div>
  );
}
