import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, Camera, ArrowRight } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const location = useLocation();
  const passedEmail = location.state?.email || new URLSearchParams(location.search).get('email') || '';

  const [formData, setFormData] = useState({
    name: '',
    email: passedEmail,
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (passedEmail) {
      setFormData(prev => ({ ...prev, email: passedEmail }));
    }
  }, [passedEmail]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !phone || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, phone, password);
      toast.success('Registration successful! Welcome to MLP Kids Studio.');
      navigate('/book', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join MLP Kids Studio to book your magical photo sessions</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-wrap">
              <User className="input-icon" />
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Parent / Guardian Name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrap">
              <Mail className="input-icon" />
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="youremail@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div className="input-wrap">
              <Phone className="input-icon" />
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="10-digit Mobile Number"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="off"
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
                name="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-wrap">
              <Lock className="input-icon" />
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
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
                <span className="spinner-sm" /> Creating Account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Register & Continue <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
