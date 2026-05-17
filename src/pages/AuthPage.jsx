import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api';
import './AuthPage.css';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');

    const url = isLogin
      ? `${API_URL}/api/auth/login`
      : `${API_URL}/api/auth/register`;

    const body = isLogin
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      login(data.user, data.token);

    } catch {
      setError('Cannot connect to server. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="logo-icon">🤖</span>
          <h1 className="logo-text">NOVA</h1>
          <p className="logo-sub">Your AI Assistant</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Login
          </button>
          <button
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <div className="auth-form">
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Bhanu Pratap"
                value={form.name}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
              />
            </div>
          )}

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="bhanu@example.com"
              value={form.email}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
            />
          </div>

          {error && <p className="error-msg">⚠️ {error}</p>}

          <button
            className="auth-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isLogin ? 'Login →' : 'Create Account →'}
          </button>
        </div>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}