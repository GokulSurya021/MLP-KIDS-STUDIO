import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Menu, X, ChevronDown, User, LogOut, Calendar, ShieldCheck } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Services' },
    { to: '/packages', label: 'Packages' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/photographers', label: 'Photographers' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/doc-ai', label: 'AI Docs' },
  ];

  const isActive = (path) => location.pathname === path;
  const isOwnerAdmin = user && (user.email?.toLowerCase() === 'gokulsurya021@gmail.com' || user.role === 'admin');

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Camera size={18} strokeWidth={1.5} />
          </div>
          <div className="logo-text">
            <span className="logo-mlp">MLP</span>
            <span className="logo-kids">Kids Studio</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar-links">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`nav-link ${isActive(to) ? 'nav-link-active' : ''}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth Area */}
        <div className="navbar-auth">
          {user ? (
            <>
              <Link
                to="/admin"
                className="btn btn-outline"
                style={{
                  padding: '9px 16px',
                  fontSize: '0.82rem',
                  borderColor: 'rgba(212, 175, 55, 0.6)',
                  color: '#D4AF37',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Open Admin Order Management"
              >
                <ShieldCheck size={15} /> Admin Portal
              </Link>
              <Link to="/book" className="btn btn-gold" style={{ padding: '10px 22px', fontSize: '0.85rem' }}>
                Book a Shoot
              </Link>
              <div className="user-dropdown" onMouseLeave={() => setDropdownOpen(false)}>
                <button
                  className="user-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onMouseEnter={() => setDropdownOpen(true)}
                >
                  <div className="user-avatar">{user.name?.[0]?.toUpperCase()}</div>
                  <ChevronDown size={14} />
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu animate-fade">
                    <div className="dropdown-user">
                      <p className="dropdown-name">{user.name}</p>
                      <p className="dropdown-email">{user.email}</p>
                    </div>
                    <Link to="/admin" className="dropdown-item text-gold">
                      <ShieldCheck size={15} /> Admin Dashboard
                    </Link>
                    <Link to="/my-bookings" className="dropdown-item">
                      <Calendar size={15} /> My Bookings
                    </Link>
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/admin"
                className="btn btn-outline"
                style={{
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  borderColor: 'rgba(212, 175, 55, 0.5)',
                  color: '#D4AF37',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Admin Portal"
              >
                <ShieldCheck size={14} /> Admin
              </Link>
              <Link to="/login" className="btn btn-ghost" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                Login
              </Link>
              <Link to="/book" className="btn btn-gold" style={{ padding: '10px 22px', fontSize: '0.85rem' }}>
                Book a Shoot
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu animate-fade">
          <ul className="mobile-links">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className={`mobile-link ${isActive(to) ? 'mobile-link-active' : ''}`}>
                  {label}
                </Link>
              </li>
            ))}
            <li className="mobile-divider" />
            <li>
              <Link to="/admin" className="mobile-link text-gold">
                🛡️ Admin Portal
              </Link>
            </li>
            {user ? (
              <>
                <li><Link to="/book" className="mobile-link text-gold">Book a Shoot</Link></li>
                <li><Link to="/my-bookings" className="mobile-link">My Bookings</Link></li>
                <li><button className="mobile-link mobile-logout" onClick={handleLogout}>Logout</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="mobile-link">Login</Link></li>
                <li><Link to="/register" className="mobile-link">Register</Link></li>
                <li><Link to="/book" className="mobile-link text-gold">Book a Shoot</Link></li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
