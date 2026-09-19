import { MapPin, Phone, Clock, Map, ExternalLink } from 'lucide-react';
import { Instagram } from '../components/Icons';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-page">
      <div className="page-hero">
        <div className="container page-hero-content">
          <span className="section-label">Get in Touch</span>
          <h1 className="page-hero-title">Contact <span className="text-gradient">MLP Kids Studio</span></h1>
          <p className="page-hero-sub">We'd love to hear from you. Reach out to book a session or ask any questions.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Info */}
            <div className="contact-info">
              <h2 className="contact-info-title">Studio Information</h2>
              <div className="gold-divider" style={{ margin: '16px 0 28px' }} />

              <div className="contact-info-items">
                <div className="contact-info-item">
                  <div className="contact-item-icon">
                    <MapPin size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="contact-item-label">Studio Address</div>
                    <div className="contact-item-value">
                      Radham Center, near Bank of India,<br />
                      Sriramnagar, Samalkot,<br />
                      Andhra Pradesh 533440
                    </div>
                    <a
                      href="https://maps.app.goo.gl/pEBoWw23bfaqc32s8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-link"
                    >
                      <ExternalLink size={12} /> Open in Google Maps
                    </a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-item-icon">
                    <Phone size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="contact-item-label">Phone Number</div>
                    <a href="tel:9515651718" className="contact-item-value contact-phone">
                      9515651718
                    </a>
                    <div className="contact-item-note">Call us to book or enquire</div>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-item-icon">
                    <Clock size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="contact-item-label">Studio Hours</div>
                    <div className="contact-item-value">Every day, 10:00 AM – 7:00 PM</div>
                    <div className="contact-item-note">Open 7 days a week</div>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-item-icon">
                    <Instagram size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="contact-item-label">Instagram</div>
                    <a
                      href="https://instagram.com/mlp_kids_studio_samalkot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-item-value contact-phone"
                    >
                      @mlp_kids_studio_samalkot
                    </a>
                    <div className="contact-item-note">Follow us for beautiful photos</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="contact-actions">
                <a href="tel:9515651718" className="btn btn-gold">
                  <Phone size={16} /> Call Now
                </a>
                <a
                  href="https://maps.app.goo.gl/pEBoWw23bfaqc32s8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  <Map size={16} /> Get Directions
                </a>
              </div>
            </div>

            {/* Map Embed + Booking Info */}
            <div className="contact-right">
              {/* Map placeholder */}
              <div className="contact-map-card">
                <div className="map-placeholder">
                  <MapPin size={40} />
                  <h3>MLP Kids Studio</h3>
                  <p>Radham Center, near Bank of India, Sriramnagar, Samalkot</p>
                  <a
                    href="https://maps.app.goo.gl/pEBoWw23bfaqc32s8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-gold"
                    style={{ marginTop: '16px' }}
                  >
                    <ExternalLink size={15} /> Open Google Maps
                  </a>
                </div>
              </div>

              {/* Booking Rules Card */}
              <div className="booking-rules-card">
                <h3 className="rules-title">📋 Quick Booking Info</h3>
                <ul className="rules-list">
                  <li><span>📌 Advance Payment:</span> ₹3,000 to confirm</li>
                  <li><span>❌ Cancellation Fee:</span> ₹1,000</li>
                  <li><span>💰 Refund:</span> ₹2,000 after cancellation</li>
                  <li><span>📅 Max Advance Booking:</span> 7 days</li>
                  <li><span>🔄 Rescheduling:</span> Allowed</li>
                  <li><span>⏱️ Buffer:</span> 2 hours between shoots</li>
                  <li><span>🕐 Hours:</span> 10 AM – 7 PM, Every day</li>
                </ul>
                <a href="/book" className="btn btn-gold" style={{ width: '100%', marginTop: '16px' }}>
                  Book a Shoot Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
