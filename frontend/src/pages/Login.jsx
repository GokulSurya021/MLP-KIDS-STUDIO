import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Camera, ArrowRight, Sparkles } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/book';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back to MLP Kids Studio!');
      if (email.toLowerCase() === 'gokulsurya021@gmail.com') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <Camera className="w-8 h-8 text-gold" />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to book sessions and manage your photo shoots</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrap">
              <Mail className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="youremail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <Lock className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="spinner-sm" /> Signing In...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign In <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create an Account
            </Link>
          </p>
          <p style={{ fontSize: '0.82rem', color: '#888', marginTop: '6px' }}>
            Studio Owner?{' '}
            <Link to="/admin" className="auth-link text-gold">
              Access Admin Portal
            </Link>
          </p>
        </div>

        <div className="demo-credentials">
          <div className="demo-tag">
            <Sparkles className="w-3.5 h-3.5 text-gold" /> Quick Access
          </div>
          <p className="demo-text">New here? Just register with your phone and email to get started immediately!</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
