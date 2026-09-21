import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import './Gallery.css';

const galleryData = [
  { id: 1, category: 'kids', src: '/images/studio/shoot-01.jpg', title: 'Aviator Dreams & Cloud Arch', size: 'wide' },
  { id: 2, category: 'kids', src: '/images/studio/shoot-02.jpg', title: 'Jungle Safari Waterfall Camp', size: 'wide' },
  { id: 3, category: 'kids', src: '/images/studio/shoot-03.jpg', title: 'Fairytale Garden & Little Tricycle', size: 'wide' },
  { id: 4, category: 'kids', src: '/images/studio/shoot-04.jpg', title: 'Rockstar Stage & Mini Grand Piano', size: 'wide' },
  { id: 5, category: 'baby', src: '/images/studio/shoot-05.jpg', title: 'Little Chef Rustic Kitchen Studio', size: 'wide' },
  { id: 6, category: 'baby', src: '/images/studio/shoot-06.jpg', title: 'Newborn Serenity on Wicker Daybed', size: 'wide' },
  { id: 7, category: 'baby', src: '/images/studio/shoot-07.jpg', title: 'Moon & Stars Celestial Cloud Sleigh', size: 'tall' },
  { id: 8, category: 'kids', src: '/images/studio/shoot-08.jpg', title: 'Princess Vanity & Dressing Suite', size: 'wide' },
  { id: 9, category: 'kids', src: '/images/studio/shoot-09.jpg', title: 'Little Wizard Magic Cauldron', size: 'tall' },
  { id: 10, category: 'baby', src: '/images/studio/shoot-10.jpg', title: 'Autumn Swing with Golden Leaves', size: 'normal' },
  { id: 11, category: 'baby', src: '/images/studio/shoot-11.jpg', title: 'Panda Bear Cuddles & Pink Teddy', size: 'wide' },
  { id: 12, category: 'events', src: '/images/studio/shoot-12.jpg', title: 'Spooky Halloween Pumpkin Cottage', size: 'wide' },
  { id: 13, category: 'family', src: '/images/studio/shoot-13.jpg', title: 'Little Krishna Divine Blessing Portrait', size: 'tall' },
  { id: 14, category: 'birthday', src: '/images/studio/shoot-14.jpg', title: '1st Birthday Sailor Nautical Voyage', size: 'wide' },
  { id: 15, category: 'baby', src: '/images/studio/shoot-15.jpg', title: 'Sweet Dreams in Pink Knit Bonnet', size: 'wide' },
  { id: 16, category: 'birthday', src: '/images/studio/shoot-16.jpg', title: 'Birth Milestone Calendar & Time Clock', size: 'wide' },
  { id: 17, category: 'events', src: '/images/studio/shoot-17.jpg', title: 'Little Pediatrician Clinic Setup', size: 'wide' },
  { id: 18, category: 'birthday', src: '/images/studio/shoot-18.jpg', title: 'Sailor Boy Smiles in Coastal Harbor', size: 'wide' },
  { id: 19, category: 'events', src: '/images/studio/shoot-19.jpg', title: 'Starlight Dreamer Moon Stage Props', size: 'wide' },
  { id: 20, category: 'birthday', src: '/images/studio/shoot-20.jpg', title: 'Happy Birthday Sailor Clapping Moments', size: 'wide' },
  { id: 21, category: 'baby', src: '/images/studio/shoot-21.jpg', title: 'Vintage Brass Tub Bubble Bath & Plumeria', size: 'wide' },
  { id: 22, category: 'kids', src: '/images/studio/shoot-22.jpg', title: 'Little Doctor in Medical Scrubs', size: 'wide' },
  { id: 23, category: 'family', src: '/images/studio/shoot-23.jpg', title: 'Traditional Silk Pattu Pavadai Portrait', size: 'wide' },
  { id: 24, category: 'birthday', src: '/images/studio/shoot-24.jpg', title: '1st Birthday O-N-E Blocks Celebration', size: 'wide' },
  { id: 25, category: 'kids', src: '/images/studio/shoot-25.jpg', title: 'Snow White Apple Orchard Carriage', size: 'wide' },
  { id: 26, category: 'family', src: '/images/studio/shoot-26.jpg', title: 'Fine Art Family Hands & Tiny Fingers', size: 'wide' },
  { id: 27, category: 'events', src: '/images/studio/shoot-27.jpg', title: 'Enchanted Fairytale Floral Cottage Setup', size: 'wide' },
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
          <div key={active} className="gallery-grid">
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
