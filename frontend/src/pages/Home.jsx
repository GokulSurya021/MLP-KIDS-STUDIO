import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Camera, Baby, Cake, Users, Star, ChevronRight, MapPin, Phone,
  Clock, ArrowRight, Check, Award, Heart, Zap
} from 'lucide-react';
import { Instagram } from '../components/Icons';
import './Home.css';

const serviceIcons = {
  'kids-photography': Camera,
  'baby-shoots': Baby,
  'birthday-shoots': Cake,
  'family-portraits': Users,
  'events': Star
};

const galleryImages = [
  { id: 1, src: '/images/baby-chef.jpg', cat: 'Baby Shoots' },
  { id: 2, src: '/images/baby-clouds-moon.jpg', cat: 'Dreamy Moon Theme' },
  { id: 3, src: '/images/krishna-smiling.jpg', cat: 'Devotional Shoots' },
  { id: 4, src: '/images/birthday-panda-one.jpg', cat: '1st Birthday Shoots' },
  { id: 5, src: '/images/kids-fairytale-garden.jpg', cat: 'Kids Photography' },
  { id: 6, src: '/images/baby-durga-blessing.jpg', cat: 'Blessing Moments' },
];

const whyUs = [
  { icon: Award, title: 'Professional Excellence', text: 'Award-winning photography with years of experience capturing childhood magic.' },
  { icon: Heart, title: 'Child-Friendly Studio', text: 'A warm, safe, and playful environment designed to make children comfortable and natural.' },
  { icon: Zap, title: 'Quick Turnaround', text: 'Professionally edited photos delivered fast. Your memories, without the wait.' },
  { icon: Camera, title: 'Premium Equipment', text: 'State-of-the-art cameras, lenses, and studio lighting for stunning, cinematic results.' },
];

const Home = () => {
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    api.get('/services').then(r => setServices(r.data.services)).catch(() => {});
    api.get('/packages').then(r => setPackages(r.data.packages)).catch(() => {});
    setTimeout(() => setHeroLoaded(true), 100);
  }, []);

  const featuredPackages = packages.filter(p => p.popular).slice(0, 3);

  return (
    <div className="home">
      {/* ========== HERO ========== */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src="/images/studio-kitchen-setup.jpg"
            alt="MLP Kids Studio - Professional Photography"
            className="hero-bg-img"
          />
          <div className="hero-overlay" />
          <div className="hero-particles">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className={`hero-content container ${heroLoaded ? 'hero-loaded' : ''}`}>
          <div className="hero-badge">
            <Camera size={14} />
            <span>Professional Photography Studio · Samalkot</span>
          </div>
          <h1 className="hero-title">
            <span className="hero-title-mlp">MLP</span>{' '}
            <span className="hero-title-kids">Kids Studio</span>
          </h1>
          <p className="hero-tagline">
            "Capturing Little Moments,<br />
            <em>Creating Lifetime Memories"</em>
          </p>
          <p className="hero-description">
            Professional kids, baby, birthday, family and event photography in Samalkot, Andhra Pradesh.
          </p>
          <div className="hero-actions">
            <Link to="/book" className="btn btn-gold hero-btn">
              <Camera size={18} /> Book a Shoot
            </Link>
            <Link to="/packages" className="btn btn-outline hero-btn">
              Explore Packages <ArrowRight size={16} />
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">500+</span>
              <span className="hero-stat-label">Happy Families</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num">11</span>
              <span className="hero-stat-label">Photographers</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num">5</span>
              <span className="hero-stat-label">Services</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num">5★</span>
              <span className="hero-stat-label">Rated</span>
            </div>
          </div>
        </div>

        <div className="hero-scroll-hint">
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ========== SERVICES ========== */}
      <section className="section services-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">What We Offer</span>
            <h2 className="section-title">Our <span>Photography Services</span></h2>
            <div className="gold-divider" />
            <p className="section-subtitle">
              From newborn babies to lively family celebrations — we specialize in capturing every precious milestone.
            </p>
          </div>

          <div className="services-grid">
            {services.map((svc, i) => {
              const Icon = serviceIcons[svc.id] || Camera;
              return (
                <Link to="/services" key={svc.id} className="service-card" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="service-icon-wrap" style={{ '--svc-color': svc.color }}>
                    <Icon size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="service-name">{svc.name}</h3>
                  <p className="service-desc">{svc.description}</p>
                  <div className="service-cta">
                    View Packages <ChevronRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== FEATURED PACKAGES ========== */}
      <section className="section packages-section">
        <div className="packages-bg" />
        <div className="container">
          <div className="section-header">
            <span className="section-label">Pricing</span>
            <h2 className="section-title">Featured <span>Packages</span></h2>
            <div className="gold-divider" />
            <p className="section-subtitle">Transparent, all-inclusive pricing. No hidden fees.</p>
          </div>

          <div className="packages-grid">
            {featuredPackages.map((pkg, i) => {
              const svcName = services.find(s => s.id === pkg.service_id)?.name || '';
              return (
                <div key={pkg.id} className="package-card">
                  <div className="package-badge-popular">⭐ Popular</div>
                  <div className="package-service">{svcName}</div>
                  <h3 className="package-name">{pkg.name}</h3>
                  <div className="package-price">
                    <span className="price-symbol">₹</span>
                    <span className="price-amount">{pkg.price.toLocaleString('en-IN')}</span>
                  </div>
                  <ul className="package-features">
                    {pkg.features.map((f, j) => (
                      <li key={j}>
                        <Check size={14} className="feature-check" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/book" className="btn btn-gold" style={{ width: '100%' }}>
                    Book This Package
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link to="/packages" className="btn btn-outline">
              View All Packages <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== GALLERY PREVIEW ========== */}
      <section className="section gallery-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Our Work</span>
            <h2 className="section-title">A Glimpse of Our <span>Gallery</span></h2>
            <div className="gold-divider" />
          </div>

          <div className="gallery-masonry">
            {galleryImages.map((img, i) => (
              <div
                key={img.id}
                className={`gallery-item ${i % 3 === 1 ? 'gallery-tall' : ''}`}
              >
                <img src={img.src} alt={`${img.cat} Photography`} loading="lazy" />
                <div className="gallery-overlay">
                  <span className="gallery-cat">{img.cat}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/gallery" className="btn btn-outline">
              View Full Gallery <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== WHY CHOOSE US ========== */}
      <section className="section why-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Why MLP Kids Studio</span>
            <h2 className="section-title">We Make Every <span>Moment Magical</span></h2>
            <div className="gold-divider" />
          </div>
          <div className="why-grid">
            {whyUs.map(({ icon: Icon, title, text }, i) => (
              <div key={i} className="why-card">
                <div className="why-icon">
                  <Icon size={26} strokeWidth={1.5} />
                </div>
                <h3 className="why-title">{title}</h3>
                <p className="why-text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BOOKING CTA ========== */}
      <section className="cta-section">
        <div className="cta-bg" />
        <div className="container">
          <div className="cta-inner">
            <span className="section-label">Ready to Create Memories?</span>
            <h2 className="cta-title">Book Your <span>Dream Shoot</span> Today</h2>
            <p className="cta-text">
              Secure your session with just ₹500 advance. Instant confirmation & online reservation.
            </p>
            <div className="cta-actions">
              <Link to="/book" className="btn btn-gold">
                <Camera size={18} /> Book a Shoot Now
              </Link>
              <a href="tel:9515651718" className="btn btn-outline">
                <Phone size={18} /> Call: 9515651718
              </a>
            </div>

            <div className="cta-info">
              <div className="cta-info-item">
                <Clock size={16} />
                <span>Every day, 10 AM – 7 PM</span>
              </div>
              <div className="cta-info-item">
                <MapPin size={16} />
                <span>Samalkot, Andhra Pradesh</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CONTACT STRIP ========== */}
      <section className="contact-strip">
        <div className="container">
          <div className="contact-strip-inner">
            <div className="contact-strip-item">
              <Phone size={20} className="cs-icon" />
              <div>
                <div className="cs-label">Phone</div>
                <a href="tel:9515651718" className="cs-value">9515651718</a>
              </div>
            </div>
            <div className="contact-strip-divider" />
            <div className="contact-strip-item">
              <MapPin size={20} className="cs-icon" />
              <div>
                <div className="cs-label">Location</div>
                <a
                  href="https://maps.app.goo.gl/pEBoWw23bfaqc32s8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cs-value"
                >
                  Samalkot, AP
                </a>
              </div>
            </div>
            <div className="contact-strip-divider" />
            <div className="contact-strip-item">
              <Clock size={20} className="cs-icon" />
              <div>
                <div className="cs-label">Hours</div>
                <span className="cs-value">Every day, 10 AM – 7 PM</span>
              </div>
            </div>
            <div className="contact-strip-divider" />
            <div className="contact-strip-item">
              <Instagram size={20} className="cs-icon" />
              <div>
                <div className="cs-label">Instagram</div>
                <a
                  href="https://www.instagram.com/mlp_kids_studio_samalkot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cs-value"
                >
                  @mlp_kids_studio_samalkot
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
