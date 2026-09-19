import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Camera, Baby, Cake, Users, Star, ArrowRight, Clock } from 'lucide-react';
import './Services.css';

const serviceIcons = {
  'kids-photography': Camera,
  'baby-shoots': Baby,
  'birthday-shoots': Cake,
  'family-portraits': Users,
  'events': Star
};

const serviceImages = {
  'kids-photography': '/images/kids-fairytale-garden.jpg',
  'baby-shoots': '/images/baby-clouds-moon.jpg',
  'birthday-shoots': '/images/birthday-panda-one.jpg',
  'family-portraits': '/images/baby-durga-blessing.jpg',
  'events': '/images/studio-kitchen-setup.jpg'
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/services'), api.get('/packages')])
      .then(([s, p]) => {
        setServices(s.data.services);
        setPackages(p.data.packages);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="services-page">
      {/* Page Header */}
      <div className="page-hero">
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <span className="section-label">What We Offer</span>
          <h1 className="page-hero-title">Our <span className="text-gradient">Photography Services</span></h1>
          <p className="page-hero-sub">From newborn babies to grand celebrations — we capture every milestone.</p>
        </div>
      </div>

      {/* Services Detail */}
      <section className="section">
        <div className="container">
          {services.map((svc, i) => {
            const Icon = serviceIcons[svc.id] || Camera;
            const svcPackages = packages.filter(p => p.service_id === svc.id);
            const isEven = i % 2 === 0;
            return (
              <div
                key={svc.id}
                className={`service-detail ${isEven ? '' : 'service-detail-reverse'}`}
              >
                <div className="service-detail-img">
                  <img src={serviceImages[svc.id]} alt={svc.name} />
                  <div className="service-detail-img-overlay" />
                  <div className="service-detail-icon">
                    <Icon size={32} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="service-detail-content">
                  <span className="section-label" style={{ fontSize: '0.7rem' }}>Photography Service</span>
                  <h2 className="service-detail-title">{svc.name}</h2>
                  <div className="gold-divider" style={{ margin: '16px 0' }} />
                  <p className="service-detail-desc">{svc.description}</p>
                  <div className="service-detail-meta">
                    <div className="service-meta-item">
                      <Clock size={16} />
                      <span>Session Duration: {svc.duration_hours} hours</span>
                    </div>
                    <div className="service-meta-item">
                      <Camera size={16} />
                      <span>{svcPackages.length} packages available</span>
                    </div>
                  </div>
                  <div className="service-detail-pkgs">
                    {svcPackages.map(pkg => (
                      <div key={pkg.id} className="service-pkg-chip">
                        <span className="pkg-chip-name">{pkg.name}</span>
                        <span className="pkg-chip-price">₹{pkg.price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="service-detail-actions">
                    <Link to={`/packages?service=${svc.id}`} className="btn btn-gold">
                      View Packages <ArrowRight size={16} />
                    </Link>
                    <Link to="/book" className="btn btn-outline">Book Now</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Services;
