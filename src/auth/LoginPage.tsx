// src/auth/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from './useAuth';
import './AuthStyles.css';

export const LoginPage: React.FC = () => {
  const { signIn, signInWithGoogle, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await signIn(email, password);
      // Navigate to dashboard (use React Router)
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (user) {
    return (
      <div className="auth-container">
        <h1>Already logged in!</h1>
        <p>Welcome, {user.displayName || user.email}</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login to FitAI</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleEmailLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="divider">OR</div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-google"
        >
          🔐 Continue with Google
        </button>

        <p className="signup-link">
          Don't have an account? <a href="/signup">Sign up here</a>
        </p>
      </div>
    </div>
  );
};
