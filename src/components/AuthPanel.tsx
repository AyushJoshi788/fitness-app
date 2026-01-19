// src/components/AuthPanel.tsx
// Production authentication UI

import { useState } from 'react';
import { motion } from 'framer-motion';
import { registerUser, loginUser, loginWithGoogle } from '../firebase/firebaseAuth';
import { ModernButton } from './ModernButton';
import { AnimatedCard } from './AnimatedCard';

interface AuthPanelProps {
  onAuthSuccess: (user: { uid: string; email: string; displayName: string }) => void;
}

export const AuthPanel = ({ onAuthSuccess }: AuthPanelProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user;
      if (mode === 'signup') {
        user = await registerUser(email, password, displayName);
      } else {
        user = await loginUser(email, password);
      }

      onAuthSuccess({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || email,
      });
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const user = await loginWithGoogle();
      onAuthSuccess({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
      });
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <AnimatedCard>
        <div className="auth-panel">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="auth-title">🏋️ AI Fitness Coach</h1>
            <p className="auth-subtitle">Your personal workout analyzer & trainer</p>
          </motion.div>

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <ModernButton loading={loading} variant="primary" fullWidth>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </ModernButton>
          </form>

          <div className="divider">OR</div>

          <ModernButton
            onClick={handleGoogleSignIn}
            loading={loading}
            variant="outline"
            fullWidth
          >
            🔐 Continue with Google
          </ModernButton>

          <div className="auth-toggle">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  className="toggle-link"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  className="toggle-link"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
};
