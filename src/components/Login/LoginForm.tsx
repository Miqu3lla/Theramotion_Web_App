import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { LoginUser, isloading, error, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await LoginUser(email, password);
  };

  return (
    <div className="tm-login-form-wrap">
      {/* Inline SVG logo — no external CDN request on the unauthenticated login
          page, which would expose visitor IPs to a third party before auth. */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div className="tm-brand-mark" style={{ width: 34, height: 34 }}>
          <svg viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18 }}>
            <path d="M1 10H6L8.5 3L13 17L15.5 10H25" stroke="#F1EDE4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: 'var(--tm-ink)' }} aria-label="Theramotion">Theramotion</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: 'var(--tm-ink)', margin: '0 0 6px' }}>Welcome back</h2>
        <p style={{ fontSize: 13.5, color: 'var(--tm-muted)', margin: 0 }}>Enter your credentials to access the clinical portal.</p>
      </div>

      {error && (
        <div className="tm-error-banner" style={{ marginBottom: 18 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <label className="tm-field-label" htmlFor="email">Email Address</label>
          <div className="tm-login-input-group">
            <Mail className="h-[18px] w-[18px]" />
            <input
              id="email"
              name="email"
              placeholder="doctor@theramotion.com"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="tm-field-label" htmlFor="password">Password</label>
          <div className="tm-login-input-group">
            <Lock className="h-[18px] w-[18px]" />
            <input
              id="password"
              name="password"
              placeholder="••••••••"
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: 66 }}
            />
            <button
              aria-label="Toggle password visibility"
              className="tm-toggle-btn"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              style={{ width: 16, height: 16, accentColor: 'var(--tm-forest)' }}
            />
            <label style={{ fontSize: 13, color: 'var(--tm-muted)' }} htmlFor="remember-me">
              Remember me
            </label>
          </div>
          <a className="tm-inline-link" href="#" style={{ fontSize: 13 }}>
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={isloading}
          className="tm-btn primary"
          style={{ padding: '13px 0', fontSize: 14.5, opacity: isloading ? 0.6 : 1, cursor: isloading ? 'not-allowed' : 'pointer' }}
        >
          {isloading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--tm-muted)', margin: 0 }}>
          Need help? <a className="tm-inline-link" style={{ fontSize: 13, display: 'inline' }} href="#">Contact Support</a>
        </p>
      </div>
    </div>
  );
}
