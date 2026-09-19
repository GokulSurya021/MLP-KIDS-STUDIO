import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Check, Camera, Baby, Cake, Users, Star } from 'lucide-react';
import './Packages.css';

const serviceIcons = {
  'kids-photography': Camera,
  'baby-shoots': Baby,
  'birthday-shoots': Cake,
  'family-portraits': Users,
  'events': Star
};

const Packages = () => {
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [activeService, setActiveService] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    Promise.all([api.get('/services'), api.get('/packages')])
      .then(([s, p]) => {
        setServices(s.data.services);
        setPackages(p.data.packages);
        const sParam = searchParams.get('service');
        if (sParam) setActiveService(sParam);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeService === 'all'
    ? packages
    : packages.filter(p => p.service_id === activeService);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="packages-page">
      <div className="page-hero">
        <div className="container page-hero-content">
          <span className="section-label">Transparent Pricing</span>
          <h1 className="page-hero-title">Photography <span className="text-gradient">Packages</span></h1>
          <p className="page-hero-sub">Choose the perfect package for your precious moments. All packages include professionally edited photos.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="pkg-filter-wrap">
        <div className="container">
          <div className="pkg-filters">
            <button
              className={`pkg-filter-btn ${activeService === 'all' ? 'active' : ''}`}
              onClick={() => setActiveService('all')}
            >
              All Packages
            </button>
            {services.map(svc => {
              const Icon = serviceIcons[svc.id] || Camera;
              return (
                <button
                  key={svc.id}
                  className={`pkg-filter-btn ${activeService === svc.id ? 'active' : ''}`}
                  onClick={() => setActiveService(svc.id)}
                >
                  <Icon size={15} /> {svc.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <section className="section">
        <div className="container">
          {activeService === 'all' ? (
            services.map(svc => {
              const svcPkgs = packages.filter(p => p.service_id === svc.id);
              const Icon = serviceIcons[svc.id] || Camera;
              return (
                <div key={svc.id} className="pkg-service-group">
                  <div className="pkg-group-header">
                    <div className="pkg-group-icon">
                      <Icon size={22} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="pkg-group-title">{svc.name}</h2>
                      <p className="pkg-group-sub">{svc.description}</p>
                    </div>
                  </div>
                  <div className="pkg-cards-row">
                    {svcPkgs.map(pkg => (
                      <PackageCard key={pkg.id} pkg={pkg} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="pkg-cards-grid">
              {filtered.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} large />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Advance Info Banner */}
      <div className="pkg-advance-banner">
        <div className="container">
          <div className="advance-inner">
            <div className="advance-info">
              <h3>Ready to Book?</h3>
              <p>Advance payment of ₹3,000 required to confirm your booking. Balance due on the day of your session.</p>
            </div>
            <Link to="/book" className="btn btn-gold">Book a Shoot Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const PackageCard = ({ pkg, large }) => (
  <div className={`pkg-card ${pkg.popular ? 'pkg-card-popular' : ''} ${large ? 'pkg-card-large' : ''}`}>
    {pkg.popular && <div className="pkg-popular-badge">⭐ Most Popular</div>}
    <div className="pkg-card-body">
      <h3 className="pkg-card-name">{pkg.name}</h3>
      <div className="pkg-card-price">
        <span className="pkg-price-symbol">₹</span>
        <span className="pkg-price-num">{pkg.price.toLocaleString('en-IN')}</span>
      </div>
      <div className="pkg-card-divider" />
      <ul className="pkg-card-features">
        {pkg.features.map((f, i) => (
          <li key={i}>
            <Check size={14} />
            {f}
          </li>
        ))}
      </ul>
    </div>
    <Link to="/book" className={`btn ${pkg.popular ? 'btn-gold' : 'btn-outline'}`} style={{ width: '100%' }}>
      Book This Package
    </Link>
  </div>
);

export default Packages;
