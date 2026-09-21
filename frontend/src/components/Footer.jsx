import { Link } from 'react-router-dom';
import { Camera, MapPin, Phone, Clock, Heart } from 'lucide-react';
import { Instagram } from './Icons';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-glow" />
      <div className="container">
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <Camera size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div className="footer-logo-mlp">MLP Kids Studio</div>
                <div className="footer-logo-tag">Professional Photography</div>
              </div>
            </Link>
            <p className="footer-tagline">
              Capturing Little Moments, Creating Lifetime Memories. Professional kids, baby, birthday, family and event photography in Samalkot.
            </p>
            <a
              href="https://www.instagram.com/mlp_kids_studio_samalkot"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-instagram"
            >
              <Instagram size={16} />
              @mlp_kids_studio_samalkot
            </a>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links">
              {[
                { to: '/', label: 'Home' },
                { to: '/services', label: 'Services' },
                { to: '/packages', label: 'Packages' },
                { to: '/gallery', label: 'Gallery' },
                { to: '/about', label: 'About Us' },
                { to: '/photographers', label: 'Our Team' },
                { to: '/contact', label: 'Contact' },
                { to: '/payment', label: '💳 Pay Advance (Razorpay)' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="footer-link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="footer-col">
            <h4 className="footer-col-title">Services</h4>
            <ul className="footer-links">
              {[
                'Kids Photography',
                'Baby Shoots',
                'Birthday Shoots',
                'Family Portraits',
                'Events & Celebrations',
              ].map((s) => (
                <li key={s}>
                  <Link to="/services" className="footer-link">{s}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-col">
            <h4 className="footer-col-title">Contact Us</h4>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <MapPin size={16} className="footer-icon" />
                <span>Radham Center, near Bank of India, Sriramnagar, Samalkot, AP 533440</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={16} className="footer-icon" />
                <a href="tel:9515651718" className="footer-link">9515651718</a>
              </div>
              <div className="footer-contact-item">
                <Clock size={16} className="footer-icon" />
                <span>Every day, 10:00 AM – 7:00 PM</span>
              </div>
              <a
                href="https://maps.app.goo.gl/pEBoWw23bfaqc32s8"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ marginTop: '16px', fontSize: '0.8rem', padding: '10px 18px' }}
              >
                <MapPin size={14} /> View on Maps
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-divider" />
          <div className="footer-bottom-inner">
            <p>© {new Date().getFullYear()} MLP Kids Studio. All rights reserved.</p>
            <p className="footer-made">
              Made with <Heart size={12} className="heart-icon" /> in Samalkot, Andhra Pradesh
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
