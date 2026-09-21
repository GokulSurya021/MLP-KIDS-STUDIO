import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Check, Camera } from 'lucide-react';
import './Packages.css';

const PACKAGE_IMAGES = {
  'diamond': '/images/studio/shoot-01.jpg',
  'gold':    '/images/studio/shoot-14.jpg',
  'silver':  '/images/studio/shoot-06.jpg',
};

const TIER_STYLE = {
  'diamond': {
    badge: '💎 DIAMOND',
    accent: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    border: '#BFDBFE',
    bg: '#EFF6FF',
    labelColor: '#1D4ED8',
  },
  'gold': {
    badge: '🥇 GOLD',
    accent: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
    border: '#FDE68A',
    bg: '#FFFBEB',
    labelColor: '#B45309',
  },
  'silver': {
    badge: '🥈 SILVER',
    accent: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
    border: '#D1D5DB',
    bg: '#F9FAFB',
    labelColor: '#4B5563',
  },
};

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/packages')
      .then(r => setPackages(r.data.packages || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="packages-page">
      {/* Page Hero */}
      <div className="page-hero">
        <div className="container page-hero-content">
          <span className="section-label">Transparent Pricing</span>
          <h1 className="page-hero-title">Photography <span className="text-gradient">Packages</span></h1>
          <p className="page-hero-sub">
            Three simple, all-inclusive packages. No hidden fees. Choose what fits your milestone.
          </p>
        </div>
      </div>

      {/* Packages Grid — 3 cards */}
      <section className="section">
        <div className="container">
          <div className="pkg-three-grid">
            {packages.map(pkg => {
              const tier = TIER_STYLE[pkg.id] || TIER_STYLE['silver'];
              return (
                <div
                  key={pkg.id}
                  className={`pkg-card ${pkg.popular ? 'pkg-card-popular' : ''}`}
                  style={{ '--tier-accent': tier.accent, '--tier-border': tier.border }}
                >
                  {/* Tier header accent bar */}
                  <div className="pkg-tier-bar" style={{ background: tier.accent }}>
                    <span className="pkg-tier-label">{tier.badge}</span>
                    {pkg.popular && <span className="pkg-popular-pill">⭐ Most Popular</span>}
                  </div>

                  {/* Photo */}
                  <div className="pkg-card-img-wrap">
                    <img
                      src={PACKAGE_IMAGES[pkg.id] || '/images/studio/shoot-01.jpg'}
                      alt={pkg.name}
                      className="pkg-card-img"
                    />
                  </div>

                  {/* Body */}
                  <div className="pkg-card-body">
                    <h2 className="pkg-card-name">{pkg.name}</h2>
                    <div className="pkg-card-price">
                      <span className="pkg-price-symbol">₹</span>
                      <span className="pkg-price-num">{pkg.price.toLocaleString('en-IN')}</span>
                      <span className="pkg-price-label">/ session</span>
                    </div>

                    <div className="pkg-quick-tags">
                      <span className="pkg-tag">⏱ {pkg.duration} Shoot</span>
                      {pkg.features.some(f => f.includes('album') || f.includes('delivery')) && (
                        <span className="pkg-tag">🚚 4 Days Delivery</span>
                      )}
                    </div>

                    <div className="pkg-card-divider" />

                    <ul className="pkg-card-features">
                      {pkg.features.map((f, i) => (
                        <li key={i}>
                          <Check size={15} className="pkg-check-icon" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="pkg-card-cta">
                    <Link
                      to={`/book?package=${pkg.id}`}
                      className={`btn ${pkg.popular ? 'btn-gold' : 'btn-outline'}`}
                      style={{ width: '100%' }}
                    >
                      <Camera size={16} /> Book {pkg.name.replace(' Package', '')} Session
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Advance Info Banner */}
      <div className="pkg-advance-banner">
        <div className="container">
          <div className="advance-inner">
            <div className="advance-info">
              <h3>Ready to Book Your Session?</h3>
              <p>
                Lock your slot with just <strong>₹3,000 advance</strong>. Balance due on shoot day.
                Cancellation: ₹1,000 fee — ₹2,000 refunded. Free rescheduling.
              </p>
            </div>
            <Link to="/book" className="btn btn-gold">Book a Shoot Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Packages;
