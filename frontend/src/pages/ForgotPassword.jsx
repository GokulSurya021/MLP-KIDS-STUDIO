import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  Mail, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import './Auth.css';

const ForgotPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialEmail = location.state?.email || new URLSearchParams(location.search).get('email') || '';

  // Form States
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password, 3 = Success
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & helper states
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setIsNewUser(false);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.success) {
        toast.success(res.data.message || 'Verification code generated!');
        if (res.data.otp) {
          setDevOtp(res.data.otp);
        }
        setStep(2);
        setResendCooldown(30);
      }
    } catch (err) {
      const noAcc = err.response?.data?.noAccount || err.response?.status === 404;
      const msg = err.response?.data?.message || 'Failed to send reset code. Please try again.';
      setErrorMsg(msg);
      setIsNewUser(Boolean(noAcc));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    if (!newPassword) {
      toast.error('Please enter your new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/reset-password', {
        email,
        otp: otp.trim(),
        newPassword
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Password reset successful!');
        setStep(3);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOtp = () => {
    if (!devOtp) return;
    navigator.clipboard.writeText(devOtp);
    setOtp(devOtp);
    setCopiedOtp(true);
    toast.success('Verification code copied & inserted!');
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Step Indicator Header */}
        <div className="auth-header">
          <div className="auth-icon-badge">
            {step === 3 ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <KeyRound className="w-8 h-8 text-gold" />
            )}
          </div>
          <h1 className="auth-title">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Reset Password'}
            {step === 3 && 'Password Reset!'}
          </h1>
          <p className="auth-subtitle">
            {step === 1 && 'Enter your registered email address and we will provide a 6-digit verification code to reset your password.'}
            {step === 2 && (
              <>
                Enter the 6-digit verification code for <strong className="text-gold-light">{email}</strong> and set your new password.
              </>
            )}
            {step === 3 && 'Your password has been updated securely. You can now sign in with your new credentials.'}
          </p>
        </div>

        {/* Step Indicators */}
        <div className="forgot-step-bar">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className={`auth-alert ${isNewUser ? 'auth-alert-newuser' : 'auth-alert-error'}`}>
            <div className="auth-alert-icon-box">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            </div>
            <div className="auth-alert-body">
              <p className="auth-alert-msg">{errorMsg}</p>
              {isNewUser && (
                <Link
                  to={`/register?email=${encodeURIComponent(email)}`}
                  state={{ email }}
                  className="auth-alert-btn"
                >
                  Create New Account
                </Link>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="auth-form" autoComplete="off">
            <div className="form-group">
              <label className="form-label">Registered Email Address</label>
              <div className="input-wrap">
                <Mail className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  placeholder="youremail@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner-sm" /> Sending Code...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send Verification Code <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>

            <div className="auth-footer">
              <Link to="/login" className="back-link">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Enter OTP & New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="auth-form" autoComplete="off">
            {/* Quick Testing Code Card */}
            {devOtp && (
              <div className="dev-otp-card">
                <div className="dev-otp-info">
                  <span className="dev-otp-tag">
                    <Sparkles className="w-3.5 h-3.5" /> Verification Code
                  </span>
                  <span className="dev-otp-code">{devOtp}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOtp}
                  className="dev-otp-btn"
                  title="Auto-fill verification code"
                >
                  {copiedOtp ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" /> Inserted
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Auto-fill
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">6-Digit Verification Code</label>
                <button
                  type="button"
                  className="resend-link"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleSendOtp}
                >
                  {resendCooldown > 0 ? (
                    `Resend code in ${resendCooldown}s`
                  ) : (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Resend Code
                    </span>
                  )}
                </button>
              </div>
              <div className="input-wrap">
                <KeyRound className="input-icon" />
                <input
                  type="text"
                  maxLength={6}
                  className="form-input otp-input"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setOtp(val);
                    if (errorMsg) setErrorMsg('');
                  }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-wrap">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-input-toggle"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="input-wrap">
                <Lock className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input password-input-toggle"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner-sm" /> Resetting Password...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Reset Password Now <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>

            <div className="auth-footer-dual">
              <button
                type="button"
                className="back-link"
                onClick={() => {
                  setStep(1);
                  setErrorMsg('');
                }}
              >
                <ArrowLeft className="w-4 h-4" /> Change Email
              </button>
              <Link to="/login" className="back-link">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* STEP 3: Success Screen */}
        {step === 3 && (
          <div className="forgot-success-box">
            <div className="success-badge-glow">
              <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            </div>
            <h2 className="success-heading">Password Changed Successfully!</h2>
            <p className="success-desc">
              Your account password has been updated. You can now use your new password to sign into MLP Kids Studio.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => navigate('/login', { replace: true })}
            >
              <span className="flex items-center gap-2">
                Proceed to Sign In <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
