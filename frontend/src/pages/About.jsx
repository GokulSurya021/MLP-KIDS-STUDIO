import { MapPin, Phone, Clock, Camera, Award, Heart, Users, Map } from 'lucide-react';
import { Instagram } from '../components/Icons';
import './About.css';

const milestones = [
  { year: '2026', title: 'Grand Opening', desc: 'MLP Kids Studio officially launched in Samalkot, Andhra Pradesh.' },
  { year: '2026', title: '20+ Themed Sets', desc: 'Built 20+ authentic, handcrafted physical sets with gentle baby-friendly studio lighting.' },
  { year: '2026', title: 'Specialized Team', desc: 'Assembled a team of 11 skilled child and family photographers across Andhra Pradesh.' },
];

const values = [
  { icon: Heart, title: 'Warmth & Care', text: 'Every child deserves to feel comfortable and joyful during their session.' },
  { icon: Award, title: 'Excellence', text: 'We deliver only the highest quality, professionally edited photographs.' },
  { icon: Users, title: 'Family Focus', text: 'We treat every family like our own, ensuring a personal and memorable experience.' },
  { icon: Camera, title: 'Artistry', text: 'Photography is art. We approach every shoot with creativity and passion.' },
];

const About = () => {
  return (
    <div className="about-page">
      {/* Header */}
      <div className="page-hero">
        <div className="container page-hero-content">
          <span className="section-label">Our Story</span>
          <h1 className="page-hero-title">About <span className="text-gradient">MLP Kids Studio</span></h1>
          <p className="page-hero-sub">A professional photography studio dedicated to capturing life's most precious moments.</p>
        </div>
      </div>

      {/* Story */}
      <section className="section">
        <div className="container">
          <div className="about-story">
            <div className="about-story-img">
              <img
                src="/images/about-owner.jpg"
                alt="MLP Kids Studio Founder & Lead Photographer"
              />
              <div className="about-story-badge">
                <div className="story-badge-num">2026</div>
                <div className="story-badge-label">Est. Studio</div>
              </div>
            </div>
            <div className="about-story-content">
              <span className="section-label">Who We Are</span>
              <h2 className="about-story-title">More Than Just <span className="text-gradient">Photography</span></h2>
              <div className="gold-divider" style={{ margin: '20px 0' }} />
              <p>
                Founded in 2026, MLP Kids Studio was born from a deep love for children and a passion for preserving the fleeting, magical moments of childhood. Located in the heart of Samalkot, Andhra Pradesh, our brand new facility offers an unmatched photography experience for young families.
              </p>
              <p style={{ marginTop: '16px' }}>
                Our studio is designed to be a warm, welcoming space where children feel free to be themselves — whether that means giggling uncontrollably, exploring props, or simply being their adorable selves. We believe the most beautiful photographs are the authentic ones.
              </p>
              <p style={{ marginTop: '16px' }}>
                With a team of 11 skilled photographers spread across Samalkot, Rajahmundry, Kakinada, Peddapuram, and beyond — we bring professional photography right to your community.
              </p>
              <div className="about-business-info">
                <div className="about-info-item">
                  <MapPin size={16} />
                  <span>Radham Center, near Bank of India, Sriramnagar, Samalkot, AP 533440</span>
                </div>
                <div className="about-info-item">
                  <Phone size={16} />
                  <a href="tel:9515651718">9515651718</a>
                </div>
                <div className="about-info-item">
                  <Clock size={16} />
                  <span>Every day, 10:00 AM – 7:00 PM</span>
                </div>
                <div className="about-info-item">
                  <Instagram size={16} />
                  <a href="https://instagram.com/mlp_kids_studio_samalkot" target="_blank" rel="noopener noreferrer">
                    @mlp_kids_studio_samalkot
                  </a>
                </div>
              </div>
              <a
                href="https://maps.app.goo.gl/pEBoWw23bfaqc32s8"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold"
                style={{ marginTop: '8px' }}
              >
                <Map size={16} /> Find Us on Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">What Drives Us</span>
            <h2 className="section-title">Our <span>Core Values</span></h2>
            <div className="gold-divider" />
          </div>
          <div className="values-grid">
            {values.map(({ icon: Icon, title, text }, i) => (
              <div key={i} className="value-card">
                <div className="value-icon"><Icon size={26} strokeWidth={1.5} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Themed Studio Sets */}
      <section className="section" style={{ background: 'var(--bg-primary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Our Creative Space</span>
            <h2 className="section-title">Handcrafted <span>Sets & Props</span></h2>
            <div className="gold-divider" />
            <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--text-secondary)' }}>
              Step into magical, handcrafted sets designed to inspire wonder, giggles, and unforgettable childhood portraits.
            </p>
          </div>
          <div className="about-sets-grid">
            <div className="about-set-card">
              <img src="/images/studio/shoot-27.jpg" alt="Fairytale Cottage Setup" />
              <div className="about-set-info">
                <h4>Fairytale Floral Cottage</h4>
                <p>Pastel blossoms, wooden tricycle & garden picket fence</p>
              </div>
            </div>
            <div className="about-set-card">
              <img src="/images/studio/shoot-19.jpg" alt="Crescent Moon Stage" />
              <div className="about-set-info">
                <h4>Moon & Starlight Sleigh</h4>
                <p>Carved wooden cloud sleigh under a celestial night sky</p>
              </div>
            </div>
            <div className="about-set-card">
              <img src="/images/studio/shoot-17.jpg" alt="Pediatrician Doctor Clinic Setup" />
              <div className="about-set-info">
                <h4>Little Doctor's Clinic</h4>
                <p>Medical scrubs, stethoscope & miniature clinic armchair</p>
              </div>
            </div>
            <div className="about-set-card">
              <img src="/images/studio/shoot-12.jpg" alt="Halloween Pumpkin Cottage" />
              <div className="about-set-info">
                <h4>Spooky Pumpkin Cottage</h4>
                <p>Jack-o'-lanterns, magic cauldron & autumn lanterns</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Our Journey</span>
            <h2 className="section-title">Milestones & <span>Memories</span></h2>
            <div className="gold-divider" />
          </div>
          <div className="timeline">
            {milestones.map((m, i) => (
              <div key={i} className={`timeline-item ${i % 2 === 0 ? 'timeline-left' : 'timeline-right'}`}>
                <div className="timeline-content">
                  <div className="timeline-year">{m.year}</div>
                  <h3 className="timeline-title">{m.title}</h3>
                  <p className="timeline-desc">{m.desc}</p>
                </div>
                <div className="timeline-dot" />
              </div>
            ))}
            <div className="timeline-line" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
