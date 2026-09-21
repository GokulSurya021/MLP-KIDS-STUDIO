import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Menu, X, ChevronDown, User, LogOut, Calendar, ShieldCheck, Phone } from 'lucide-react';
import { Instagram } from '../components/Icons';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pillPos, setPillPos] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef({});
  const navLinksRef = useRef(null);

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

  // Measure and animate the active tab pill when location changes
  useEffect(() => {
    const updatePill = () => {
      const activeEl = tabRefs.current[location.pathname];
      if (activeEl && navLinksRef.current) {
        const containerRect = navLinksRef.current.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        setPillPos({
          left: activeRect.left - containerRect.left,
          width: activeRect.width,
          opacity: 1
        });
      } else {
        setPillPos(prev => ({ ...prev, opacity: 0 }));
      }
    };

    updatePill();
    // Re-check on next animation frame in case fonts/styles are calculating
    const frame = requestAnimationFrame(updatePill);
    window.addEventListener('resize', updatePill);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePill);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Services' },
    { to: '/packages', label: 'Packages' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const isActive = (path) => location.pathname === path;
  const isOwnerAdmin = user && user.email?.toLowerCase() === 'gokulsurya021@gmail.com';

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

        {/* Desktop Nav with Sliding Tab Indicator */}
        <ul className="navbar-links" ref={navLinksRef}>
          <span
            className="nav-active-pill"
            style={{
              transform: `translateX(${pillPos.left}px)`,
              width: `${pillPos.width}px`,
              opacity: pillPos.opacity,
            }}
          />
          {navLinks.map(({ to, label }) => (
            <li
              key={to}
              ref={(el) => {
                if (el) tabRefs.current[to] = el;
              }}
            >
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
          <a href="tel:9515651718" className="nav-phone-btn" title="Call MLP Kids Studio">
            <Phone size={13} />
            <span>9515651718</span>
          </a>
          {user ? (
            <>
              {isOwnerAdmin && (
                <Link
                  to="/admin"
                  className="btn btn-outline nav-admin-btn"
                  title="Open Admin Order Management"
                >
                  <ShieldCheck size={14} /> Admin Portal
                </Link>
              )}
              <Link to="/book" className="btn btn-gold nav-book-btn">
                Book Shoot
              </Link>
              <div className="user-dropdown" onMouseLeave={() => setDropdownOpen(false)}>
                <button
                  className="user-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onMouseEnter={() => setDropdownOpen(true)}
                  aria-label="User menu"
                >
                  <div className="user-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
                  <ChevronDown size={14} />
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu animate-fade">
                    <div className="dropdown-user">
                      <p className="dropdown-name">{user.name}</p>
                      <p className="dropdown-email">{user.email}</p>
                    </div>
                    {isOwnerAdmin && (
                      <Link to="/admin" className="dropdown-item text-gold">
                        <ShieldCheck size={15} /> Admin Dashboard
                      </Link>
                    )}
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
              <Link to="/login" className="btn btn-ghost nav-login-btn">
                Sign In
              </Link>
              <Link to="/book" className="btn btn-gold nav-book-btn">
                Book Shoot
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
