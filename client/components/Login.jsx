import React, { useState } from 'react';
import { api } from '../api';

export default function Login({ onAuthSuccess, onCancel }) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isSignup) {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        res = await api.signup({ name, email, password });
      } else {
        res = await api.login({ email, password });
      }

      // Save token and pass user back to parent
      localStorage.setItem('airshare_token', res.token);
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div className="tab-switch">
        <button
          type="button"
          className={`tab-btn ${!isSignup ? 'active' : ''}`}
          onClick={() => {
            setIsSignup(false);
            setError('');
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`tab-btn ${isSignup ? 'active' : ''}`}
          onClick={() => {
            setIsSignup(true);
            setError('');
          }}
        >
          Create Account
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {isSignup && (
          <div className="form-group">
            <label htmlFor="auth-name">Full Name</label>
            <input
              id="auth-name"
              type="text"
              className="form-input"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="auth-email">Email Address</label>
          <input
            id="auth-email"
            type="email"
            className="form-input"
            placeholder="traveller@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            className="form-input"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Please wait...' : isSignup ? 'Sign Up & Continue' : 'Log In'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
