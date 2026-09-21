import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Camera, Baby, Cake, Users, Star, ChevronRight, MapPin, Phone,
  Clock, ArrowRight, Check, Award, Heart, Zap, ChevronLeft, MessageCircle
} from 'lucide-react';
import { Instagram, WhatsApp } from '../components/Icons';
import './Home.css';

const serviceIcons = {
  'kids-photography': Camera,
  'baby-shoots': Baby,
  'birthday-shoots': Cake,
  'family-portraits': Users,
  'events': Star
};

const serviceImages = {
  'kids-photography': '/images/studio/shoot-01.jpg',
  'baby-shoots': '/images/studio/shoot-06.jpg',
  'birthday-shoots': '/images/studio/shoot-14.jpg',
  'family-portraits': '/images/studio/shoot-26.jpg',
  'events': '/images/studio/shoot-04.jpg',
};

const packagePhotos = {
  'diamond': '/images/studio/shoot-01.jpg',
  'gold':    '/images/studio/shoot-14.jpg',
  'silver':  '/images/studio/shoot-06.jpg',
};

const TIER_STYLE = {
  'diamond': { gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', emoji: '💎' },
  'gold':    { gradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', emoji: '🥇' },
  'silver':  { gradient: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)', emoji: '🥈' },
};

const heroSlides = [
  {
    image: '/images/studio/shoot-01.jpg',
    tag: 'Aviator & Fantasy Themes',
    caption: 'Bespoke props, vintage planes, and cinematic lighting.',
  },
  {
    image: '/images/studio/shoot-07.jpg',
    tag: 'Magical Moon & Stars',
    caption: 'Dreamy sets designed safely for newborn & baby milestones.',
  },
  {
    image: '/images/studio/shoot-14.jpg',
    tag: '1st Birthday Grand Celebrations',
    caption: 'Cake smash, sailor themes, and joyful laughter forever saved.',
  },
  {
    image: '/images/studio/shoot-03.jpg',
    tag: 'Fairytale Garden Dreams',
    caption: 'Enchanting floral backdrops and whimsical childhood wonder.',
  },
];

const galleryImages = [
  { id: 1, src: '/images/studio/shoot-01.jpg', cat: 'Aviator Dreams' },
  { id: 2, src: '/images/studio/shoot-07.jpg', cat: 'Moon & Stars Sleigh' },
  { id: 3, src: '/images/studio/shoot-02.jpg', cat: 'Safari Adventure' },
  { id: 4, src: '/images/studio/shoot-14.jpg', cat: '1st Birthday Sailor' },
  { id: 5, src: '/images/studio/shoot-05.jpg', cat: 'Little Chef Studio' },
  { id: 6, src: '/images/studio/shoot-06.jpg', cat: 'Newborn Serenity' },
  { id: 7, src: '/images/studio/shoot-03.jpg', cat: 'Fairytale Garden' },
  { id: 8, src: '/images/studio/shoot-04.jpg', cat: 'Rockstar Baby' },
  { id: 9, src: '/images/studio/shoot-08.jpg', cat: 'Princess Vanity' },
  { id: 10, src: '/images/studio/shoot-10.jpg', cat: 'Autumn Swing' },
  { id: 11, src: '/images/studio/shoot-13.jpg', cat: 'Little Krishna' },
  { id: 12, src: '/images/studio/shoot-26.jpg', cat: 'Family Heirloom' },
];


const instagramGrid = [
  { id: 1, src: '/images/studio/shoot-02.jpg', tag: 'Safari Toddler' },
  { id: 2, src: '/images/studio/shoot-05.jpg', tag: 'Little Masterchef' },
  { id: 3, src: '/images/studio/shoot-08.jpg', tag: 'Princess Studio' },
  { id: 4, src: '/images/studio/shoot-10.jpg', tag: 'Autumn Fantasy' },
  { id: 5, src: '/images/studio/shoot-13.jpg', tag: 'Little Krishna' },
  { id: 6, src: '/images/studio/shoot-24.jpg', tag: 'Birthday Jubilee' },
];

const whyUs = [
  { icon: Award, title: 'Modern 2026 Studio', text: 'Brand new, state-of-the-art photography studio in Samalkot equipped with high-end cameras, gentle baby-safe lighting, and creative themes.' },
  { icon: Heart, title: 'Child-Friendly Studio', text: 'A warm, safe, and playful environment designed to make children comfortable and natural.' },
  { icon: Zap, title: 'Quick 4-Day Turnaround', text: 'Album and high-res raw data delivered promptly in 4 days. Your memories, without the wait.' },
  { icon: Camera, title: 'Handcrafted Sets & Props', text: 'Over 20+ authentic themed physical sets: Aviator, Moon & Stars, Safari, Chef, and Royal Krishna.' },
];

const Home = () => {
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    api.get('/services').then(r => setServices(r.data.services)).catch(() => {});
    api.get('/packages').then(r => setPackages(r.data.packages)).catch(() => {});
    setTimeout(() => setHeroLoaded(true), 100);
  }, []);

  // Auto rotate hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Show all 3 packages on home page
  const featuredPackages = packages.slice(0, 3);

  const prevSlide = () => {
    setActiveSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const nextSlide = () => {
    setActiveSlide(prev => (prev + 1) % heroSlides.length);
  };

  return (
    <div className="home">
      {/* ========== HERO WITH PHOTO CAROUSEL ========== */}
      <section className="hero">
        <div className="hero-bg-carousel">
          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`hero-bg-slide ${idx === activeSlide ? 'active' : ''}`}
            >
              <img
                src={slide.image}
                alt={`MLP Kids Studio - ${slide.tag}`}
                className="hero-bg-img"
              />
            </div>
          ))}
          <div className="hero-overlay" />
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
            Samalkot's premier studio for kids, babies, cake smash, family portraits, and milestone photography. Featuring handcrafted sets, gentle lighting, and certified child photographers.
          </p>



          {/* Quick contact / phone call banner right in hero */}
          <div className="hero-phone-strip">
            <a href="tel:9515651718" className="hero-phone-link">
              <Phone size={16} className="hero-phone-icon" />
              <span>Direct Call: <strong>9515651718</strong></span>
            </a>
            <span className="hero-phone-divider">•</span>
            <a
              href="https://wa.me/919515651718?text=Hi%20MLP%20Kids%20Studio%2C%20I%20would%20like%20to%20inquire%20about%20booking%20a%20photoshoot!"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-whatsapp-link"
            >
              <WhatsApp size={16} />
              <span>WhatsApp: <strong>9515651718</strong></span>
            </a>
          </div>

          <div className="hero-actions">
            <Link to="/book" className="btn btn-gold hero-btn">
              <Camera size={18} /> Book a Shoot
            </Link>
            <a href="tel:9515651718" className="btn btn-call hero-btn">
              <Phone size={18} /> Call: 9515651718
            </a>
            <a
              href="https://wa.me/919515651718?text=Hi%20MLP%20Kids%20Studio%2C%20I%20would%20like%20to%20inquire%20about%20booking%20a%20photoshoot!"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp hero-btn"
            >
              <WhatsApp size={18} /> WhatsApp Chat
            </a>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">2026</span>
              <span className="hero-stat-label">Est. Studio</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num">20+</span>
              <span className="hero-stat-label">Custom Themes</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num">11</span>
              <span className="hero-stat-label">Photographers</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num">4-Day</span>
              <span className="hero-stat-label">Fast Delivery</span>
            </div>
          </div>
        </div>

        {/* Hero Carousel Navigation Controls */}
        <div className="hero-carousel-controls">
          <button onClick={prevSlide} className="hero-nav-btn" aria-label="Previous Slide">
            <ChevronLeft size={20} />
          </button>
          <div className="hero-dots">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                className={`hero-dot ${i === activeSlide ? 'active' : ''}`}
                onClick={() => setActiveSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button onClick={nextSlide} className="hero-nav-btn" aria-label="Next Slide">
            <ChevronRight size={20} />
          </button>
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
              From newborn babies to lively family celebrations — we specialize in capturing every precious milestone with authentic setups and custom props.
            </p>
          </div>

          <div className="services-grid">
            {services.map((svc, i) => {
              const Icon = serviceIcons[svc.id] || Camera;
              return (
                <Link to="/services" key={svc.id} className="service-card" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="service-card-img-wrap">
                    <img
                      src={serviceImages[svc.id] || '/images/studio/shoot-01.jpg'}
                      alt={svc.name}
                      className="service-card-img"
                    />
                  </div>
                  <div className="service-icon-wrap" style={{ '--svc-color': svc.color }}>
                    <Icon size={24} strokeWidth={1.5} />
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
            <span className="section-label">Studio Packages</span>
            <h2 className="section-title">Package <span>Information & Inclusions</span></h2>
            <div className="gold-divider" />
            <p className="section-subtitle">
              Complete package details for Diamond, Gold, and Silver sessions. Lock your preferred date with ₹3,000 advance.
            </p>
          </div>

          <div className="packages-grid">
            {featuredPackages.map((pkg) => {
              const tier = TIER_STYLE[pkg.id] || TIER_STYLE['silver'];
              return (
                <div key={pkg.id} className="package-card">
                  {/* Tier header bar */}
                  <div className="package-tier-bar" style={{ background: tier.gradient }}>
                    <span className="package-tier-label">{tier.emoji} {pkg.name}</span>
                    {pkg.popular && (
                      <span className="package-badge-popular">⭐ Most Popular</span>
                    )}
                  </div>
                  <div className="package-card-img-wrap">
                    <img
                      src={packagePhotos[pkg.id] || '/images/studio/shoot-01.jpg'}
                      alt={pkg.name}
                      className="package-card-img"
                    />
                  </div>
                  <div className="package-card-body">
                    <div className="package-price">
                      <span className="price-symbol">₹</span>
                      <span className="price-amount">{pkg.price.toLocaleString('en-IN')}</span>
                      <span className="price-per">/ session</span>
                    </div>
                    <div className="package-duration-row">
                      <span>⏱ {pkg.duration} Shoot</span>
                    </div>
                    <ul className="package-features">
                      {pkg.features.map((f, j) => (
                        <li key={j}>
                          <Check size={14} className="feature-check" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link to={`/book?package=${pkg.id}`} className={`btn ${pkg.popular ? 'btn-gold' : 'btn-outline'}`} style={{ width: '100%' }}>
                      Book {pkg.name.replace(' Package','')}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== GALLERY PREVIEW ========== */}
      <section className="section gallery-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Real Client Shoots</span>
            <h2 className="section-title">A Glimpse of Our <span>Real Studio Work</span></h2>
            <div className="gold-divider" />
            <p className="section-subtitle">
              100% genuine photos captured right here in our Samalkot studio.
            </p>
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
              Explore All 27+ Studio Themes <ArrowRight size={16} />
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

      {/* ========== INSTAGRAM SHOWCASE STRIP ========== */}
      <section className="instagram-showcase-section">
        <div className="container">
          <div className="instagram-header">
            <div className="instagram-title-wrap">
              <Instagram size={28} className="ig-icon" />
              <div>
                <h3 className="ig-heading">Follow Our Journey on Instagram</h3>
                <p className="ig-subheading">Catch daily behind-the-scenes, reels & newborn adorable moments</p>
              </div>
            </div>
            <a
              href="https://www.instagram.com/mlp_kids_studio_samalkot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline ig-follow-btn"
            >
              @mlp_kids_studio_samalkot <ArrowRight size={16} />
            </a>
          </div>

          <div className="instagram-strip">
            {instagramGrid.map((post) => (
              <a
                key={post.id}
                href="https://www.instagram.com/mlp_kids_studio_samalkot"
                target="_blank"
                rel="noopener noreferrer"
                className="ig-strip-item"
              >
                <img src={post.src} alt={post.tag} loading="lazy" />
                <div className="ig-strip-overlay">
                  <Instagram size={22} />
                  <span>{post.tag}</span>
                </div>
              </a>
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
              Lock your preferred studio slot with ₹3,000 advance. Free rescheduling up to 24 hours prior. Fast 4-day delivery of your album and raw files!
            </p>
            <div className="cta-actions">
              <Link to="/book" className="btn btn-gold">
                <Camera size={18} /> Book a Shoot Now
              </Link>
              <a
                href="https://wa.me/919515651718?text=Hi%20MLP%20Kids%20Studio%2C%20I%20want%20to%20book%20a%20photoshoot%20slot!"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp-cta"
              >
                <WhatsApp size={18} /> Chat on WhatsApp
              </a>
              <a href="tel:9515651718" className="btn btn-cta-call">
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
              <WhatsApp size={20} className="cs-icon" style={{ color: '#25D366' }} />
              <div>
                <div className="cs-label">WhatsApp Quick Booking</div>
                <a
                  href="https://wa.me/919515651718?text=Hi%20MLP%20Kids%20Studio%2C%20I%20would%20like%20to%20book%20a%20shoot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cs-value"
                >
                  9515651718
                </a>
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
