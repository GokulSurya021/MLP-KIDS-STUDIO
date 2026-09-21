import { useState, useEffect } from 'react';
import api from '../api/axios';
import { MapPin, Phone, Camera, Video } from 'lucide-react';
import './Photographers.css';

const Photographers = () => {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/photographers')
      .then(r => setPhotographers(r.data.photographers || []))
      .catch(() => setPhotographers([{
        id: 'lokesh',
        name: 'Lokesh',
        phone: '7207209993',
        specialization: 'Photography & Video Editing',
        location: 'Samalkot',
        available: true
      }]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const lokesh = photographers.find(p => p.id === 'lokesh') || photographers[0] || {
    id: 'lokesh',
    name: 'Lokesh',
    phone: '7207209993',
    specialization: 'Photography & Video Editing',
    location: 'Samalkot',
    available: true
  };

  return (
    <div className="photographers-page">
      {/* Header */}
      <div className="page-hero">
        <div className="container page-hero-content">
          <span className="section-label">Lead Photographer</span>
          <h1 className="page-hero-title">Our <span className="text-gradient">Photographer</span></h1>
          <p className="page-hero-sub">Master photographer and creative video editor capturing timeless smiles at MLP Kids Studio.</p>
        </div>
      </div>

      {/* Photographer Showcase */}
      <section className="section">
        <div className="container">
          <div style={{ maxWidth: '540px', margin: '0 auto' }}>
            <div className="photog-card" style={{ padding: '36px 28px' }}>
              <div
                className="photog-avatar"
                style={{
                  width: '90px',
                  height: '90px',
                  fontSize: '2.2rem',
                  background: 'linear-gradient(135deg, #D4AF37, #DAA520)',
                  boxShadow: '0 8px 24px rgba(212,175,55,0.4)'
                }}
              >
                {lokesh.name[0]}
              </div>
              <h2 className="photog-name" style={{ fontSize: '1.5rem', marginTop: '6px' }}>{lokesh.name}</h2>
              <div className="photog-spec" style={{ fontSize: '0.95rem' }}>
                <Video size={16} /> <Camera size={16} /> {lokesh.specialization}
              </div>
              <div className="photog-location" style={{ fontSize: '0.9rem' }}>
                <MapPin size={15} />
                {lokesh.location}, Andhra Pradesh
              </div>
              <a href={`tel:${lokesh.phone}`} className="photog-phone" style={{ fontSize: '0.95rem', padding: '9px 22px' }}>
                <Phone size={15} />
                {lokesh.phone}
              </a>
            </div>
          </div>

          {/* Book CTA */}
          <div className="photog-cta" style={{ maxWidth: '640px', margin: '48px auto 0' }}>
            <h3>Book Your Session with Lokesh</h3>
            <p>Every session at MLP Kids Studio is personally crafted and captured to give your family unforgettable memories.</p>
            <a href="/book" className="btn btn-gold">Book a Shoot Now</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Photographers;
