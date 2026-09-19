import { useState, useEffect } from 'react';
import api from '../api/axios';
import { MapPin, Phone, Camera, Video } from 'lucide-react';
import './Photographers.css';

const Photographers = () => {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/photographers')
      .then(r => setPhotographers(r.data.photographers))
      .finally(() => setLoading(false));
  }, []);

  const locations = ['all', ...new Set(photographers.map(p => p.location))];
  const filtered = filter === 'all' ? photographers : photographers.filter(p => p.location === filter);

  const avatarColors = ['#D4AF37', '#B8960C', '#C9A96E', '#DAA520', '#F0D060', '#B8860B'];

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="photographers-page">
      {/* Header */}
      <div className="page-hero">
        <div className="container page-hero-content">
          <span className="section-label">Meet the Team</span>
          <h1 className="page-hero-title">Our <span className="text-gradient">Photographers</span></h1>
          <p className="page-hero-sub">A talented team of professional photographers across Andhra Pradesh.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="gallery-filter-wrap">
        <div className="container">
          <div className="gallery-filters">
            {locations.map(loc => (
              <button
                key={loc}
                className={`gallery-filter-btn ${filter === loc ? 'active' : ''}`}
                onClick={() => setFilter(loc)}
              >
                {loc === 'all' ? 'All Locations' : loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Photographers Grid */}
      <section className="section">
        <div className="container">
          <div className="photog-grid">
            {filtered.map((p, i) => (
              <div key={p.id} className="photog-card">
                <div
                  className="photog-avatar"
                  style={{ background: `linear-gradient(135deg, ${avatarColors[i % avatarColors.length]}, ${avatarColors[(i + 2) % avatarColors.length]})` }}
                >
                  {p.name[0]}
                </div>
                <h3 className="photog-name">{p.name}</h3>
                <div className="photog-spec">
                  {p.specialization.includes('Video') ? (
                    <><Video size={13} /> {p.specialization}</>
                  ) : (
                    <><Camera size={13} /> {p.specialization}</>
                  )}
                </div>
                <div className="photog-location">
                  <MapPin size={13} />
                  {p.location}
                </div>
                <a href={`tel:${p.phone}`} className="photog-phone">
                  <Phone size={13} />
                  {p.phone}
                </a>
              </div>
            ))}
          </div>

          {/* Book CTA */}
          <div className="photog-cta">
            <h3>Choose Your Photographer</h3>
            <p>Select a specific photographer when booking, or let us assign the best available photographer for your session.</p>
            <a href="/book" className="btn btn-gold">Book a Shoot</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Photographers;
