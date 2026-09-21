import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Camera, ArrowRight, AlertCircle, UserPlus, KeyRound } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorInfo, setErrorInfo] = useState({ text: '', isNewUser: false });
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
    setErrorInfo({ text: '', isNewUser: false });

    try {
      await login(email, password);
      toast.success('Welcome back to MLP Kids Studio!');
      if (email.toLowerCase() === 'gokulsurya021@gmail.com') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const isNewUser = err.response?.data?.noAccount || err.response?.status === 404;
      let errorMsg;
      if (isNewUser) {
        errorMsg = err.response?.data?.message || 'No account found. New user? Please create a new account.';
      } else {
        errorMsg = 'Incorrect username or password';
      }
      
      setErrorInfo({
        text: errorMsg,
        isNewUser: Boolean(isNewUser)
      });

      toast.error(errorMsg, {
        duration: isNewUser ? 6000 : 4500
      });
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

        {errorInfo.text && (
          <div className={`auth-alert ${errorInfo.isNewUser ? 'auth-alert-newuser' : 'auth-alert-error'}`}>
            <div className="auth-alert-icon-box">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            </div>
            <div className="auth-alert-body">
              <p className="auth-alert-msg">{errorInfo.text}</p>
              {errorInfo.isNewUser ? (
                <Link
                  to={`/register?email=${encodeURIComponent(email)}`}
                  state={{ email }}
                  className="auth-alert-btn"
                >
                  <UserPlus className="w-4 h-4" /> Create New Account
                </Link>
              ) : (
                <Link
                  to={`/forgot-password?email=${encodeURIComponent(email)}`}
                  state={{ email }}
                  className="auth-alert-btn auth-alert-btn-reset"
                >
                  <KeyRound className="w-4 h-4" /> Reset Password?
                </Link>
              )}
            </div>
          </div>
        )}

      
        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrap">
              <Mail className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="youremail@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorInfo.text) setErrorInfo({ text: '', isNewUser: false });
                }}
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Password</label>
              <Link 
                to={`/forgot-password?email=${encodeURIComponent(email)}`} 
                state={{ email }} 
                className="forgot-password-link"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="input-wrap">
              <Lock className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorInfo.text && !errorInfo.isNewUser) setErrorInfo({ text: '', isNewUser: false });
                }}
                autoComplete="new-password"
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
        </div>
      </div>
    </div>
  );
};

export default Login;

