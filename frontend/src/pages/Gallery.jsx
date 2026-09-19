import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import './Gallery.css';

const galleryData = [
  { id: 1, category: 'kids', src: '/images/baby-chef.jpg', title: 'Little Chef Adventure', size: 'wide' },
  { id: 2, category: 'baby', src: '/images/baby-clouds-moon.jpg', title: 'Moon & Starlight Dream', size: 'tall' },
  { id: 3, category: 'birthday', src: '/images/birthday-panda-one.jpg', title: 'First Birthday Panda Celebration', size: 'normal' },
  { id: 4, category: 'family', src: '/images/baby-durga-blessing.jpg', title: 'Divine Blessings & Grace', size: 'tall' },
  { id: 5, category: 'kids', src: '/images/kids-fairytale-garden.jpg', title: 'Fairytale Garden Princess', size: 'normal' },
  { id: 6, category: 'events', src: '/images/studio-kitchen-setup.jpg', title: 'Custom Studio Kitchen Setup', size: 'wide' },
  { id: 7, category: 'baby', src: '/images/baby-warm-blessing.jpg', title: 'Golden Warmth Newborn Moments', size: 'normal' },
  { id: 8, category: 'kids', src: '/images/krishna-smiling.jpg', title: 'Little Krishna Smiles', size: 'wide' },
  { id: 9, category: 'birthday', src: '/images/birthday-panda-one.jpg', title: 'Celebration Stage & Props', size: 'tall' },
  { id: 10, category: 'family', src: '/images/krishna-looking-up.jpg', title: 'Devotional Heritage Portrait', size: 'wide' },
  { id: 11, category: 'events', src: '/images/studio-kitchen-setup.jpg', title: 'Themed Studio Experience', size: 'normal' },
  { id: 12, category: 'baby', src: '/images/baby-durga-blessing.jpg', title: 'Innocence & Devotional Grace', size: 'normal' },
];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'kids', label: 'Kids' },
  { id: 'baby', label: 'Babies' },
  { id: 'birthday', label: 'Birthdays' },
  { id: 'family', label: 'Families' },
  { id: 'events', label: 'Events' },
];

const Gallery = () => {
  const [active, setActive] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  const filtered = active === 'all' ? galleryData : galleryData.filter(i => i.category === active);

  return (
    <div className="gallery-page">
      {/* Header */}
      <div className="page-hero">
        <div className="container page-hero-content">
          <span className="section-label">Our Portfolio</span>
          <h1 className="page-hero-title">Photography <span className="text-gradient">Gallery</span></h1>
          <p className="page-hero-sub">A glimpse into the magical moments we've captured for hundreds of families.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="gallery-filter-wrap">
        <div className="container">
          <div className="gallery-filters">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`gallery-filter-btn ${active === cat.id ? 'active' : ''}`}
                onClick={() => setActive(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry Grid */}
      <section className="section">
        <div className="container">
          <div className="gallery-grid">
            {filtered.map(img => (
              <div
                key={img.id}
                className={`gallery-grid-item gallery-${img.size}`}
                onClick={() => setLightbox(img)}
              >
                <img src={img.src} alt={img.title} loading="lazy" />
                <div className="gallery-grid-overlay">
                  <div className="gallery-grid-info">
                    <ZoomIn size={24} />
                    <span>{img.title}</span>
                    <span className="gallery-grid-cat">
                      {categories.find(c => c.id === img.category)?.label}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center" style={{ padding: '60px 0', color: 'var(--text-muted)' }}>
              No photos in this category yet.
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>
            <X size={24} />
          </button>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <img src={lightbox.src.replace('w=600', 'w=1200')} alt={lightbox.title} />
            <div className="lightbox-caption">
              <span>{lightbox.title}</span>
              <span className="lightbox-cat">{categories.find(c => c.id === lightbox.category)?.label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
