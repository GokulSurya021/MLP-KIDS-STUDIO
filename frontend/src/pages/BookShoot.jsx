import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, Camera, CheckCircle2, AlertCircle,
  Sparkles, ArrowRight, ArrowLeft, ShieldAlert, User, Phone, Mail, QrCode
} from 'lucide-react';
import PaymentScannerModal from '../components/PaymentScannerModal';
import './BookShoot.css';

const TIME_SLOTS = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const formatTime12h = (time24) => {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m < 10 ? '0' + m : m} ${period}`;
};

const BookShoot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedService = searchParams.get('service') || '';
  const preselectedPackage = searchParams.get('package') || '';

  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedService);
  const [selectedPackageId, setSelectedPackageId] = useState(preselectedPackage);
  const [selectedPhotographerId, setSelectedPhotographerId] = useState('any');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [advancePaid, setAdvancePaid] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Date constraints: today to 7 days from now
  const today = new Date().toISOString().split('T')[0];
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 7);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  const [rules, setRules] = useState({ advance_payment: 3000, cancellation_fee: 1000, refund_after_cancellation: 2000 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [srvRes, pkgRes, photogRes, ruleRes] = await Promise.all([
          api.get('/services'),
          api.get('/packages'),
          api.get('/photographers'),
          api.get('/rules').catch(() => ({ data: { rules: null } }))
        ]);
        const srvList = srvRes.data?.services || srvRes.data || [];
        const pkgList = pkgRes.data?.packages || pkgRes.data || [];
        const photogList = photogRes.data?.photographers || photogRes.data || [];

        setServices(srvList);
        setPackages(pkgList);
        setPhotographers(photogList);

        // Auto-select initial service
        const initialSvc = preselectedService || (srvList.length > 0 ? srvList[0].id : '');
        if (initialSvc) {
          setSelectedServiceId(initialSvc);
          const availablePkgs = pkgList.filter(p => (p.service_id || p.serviceId) === initialSvc);
          if (availablePkgs.length > 0) {
            const initialPkg = preselectedPackage && availablePkgs.find(p => p.id === preselectedPackage)
              ? preselectedPackage
              : availablePkgs[0].id;
            setSelectedPackageId(initialPkg);
          }
        }

        if (ruleRes.data?.rules) {
          setRules(ruleRes.data.rules);
        }
      } catch (err) {
        toast.error('Failed to load services or packages');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [preselectedService, preselectedPackage]);

  // Sync user info when available
  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Set default shoot date to tomorrow and default time slot
  useEffect(() => {
    if (!selectedDate) {
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      setSelectedDate(tmrw.toISOString().split('T')[0]);
    }
    if (!selectedTime) {
      setSelectedTime('11:00');
    }
  }, []);

  const filteredPackages = packages.filter(p => !selectedServiceId || (p.service_id || p.serviceId) === selectedServiceId);
  const selectedPackage = packages.find(p => p.id === selectedPackageId);
  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedPhotographer = photographers.find(p => p.id === selectedPhotographerId);

  const handleSelectService = (svcId) => {
    setSelectedServiceId(svcId);
    const available = packages.filter(p => (p.service_id || p.serviceId) === svcId);
    if (available.length > 0) {
      setSelectedPackageId(available[0].id);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedServiceId || !selectedPackageId) {
      toast.error('Please select a service and package');
      setStep(1);
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error('Please choose a date and time slot');
      setStep(2);
      return;
    }

    if (!customerName?.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!email?.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!phone?.trim() || phone.trim().length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/bookings', {
        customerName: customerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        serviceId: selectedServiceId,
        packageId: selectedPackageId,
        photographerId: selectedPhotographerId || 'any',
        date: selectedDate,
        time: selectedTime,
        specialRequests: specialRequests?.trim() || '',
        advancePaid
      });

      if (res.data?.success) {
        toast.success(advancePaid ? 'Shoot booked & ₹500 advance confirmed!' : 'Shoot booked successfully!');
        navigate('/my-bookings', { state: { newBooking: res.data.booking } });
      } else {
        toast.error(res.data?.message || 'Failed to complete reservation');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to complete booking. Please choose another time slot.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="book-loading-container">
        <div className="spinner" />
        <p>Preparing booking studio...</p>
      </div>
    );
  }

  return (
    <div className="book-page">
      <div className="book-container">
        {/* Header */}
        <div className="book-header">
          <span className="section-eyebrow">
            <Sparkles className="w-4 h-4 text-gold" /> Reserve Your Session
          </span>
          <h1 className="book-title">Book a Photo Shoot</h1>
          <p className="book-subtitle">
            Capture precious moments at MLP Kids Studio, Samalkot. Quick 3-step booking with instant confirmation.
          </p>

          {/* Stepper */}
          <div className="stepper">
            <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-num">1</div>
              <span className="step-label">Select Package</span>
            </div>
            <div className="step-line" />
            <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-num">2</div>
              <span className="step-label">Date & Time</span>
            </div>
            <div className="step-line" />
            <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
              <div className="step-num">3</div>
              <span className="step-label">Review & Confirm</span>
            </div>
          </div>
        </div>

        {/* Step 1: Service & Package Selection */}
        {step === 1 && (
          <div className="step-content">
            <h2 className="step-heading">1. Choose Service & Package</h2>

            {/* Service Tabs */}
            <div className="service-tabs">
              {services.map(svc => (
                <button
                  key={svc.id}
                  className={`service-tab-btn ${selectedServiceId === svc.id ? 'active' : ''}`}
                  onClick={() => handleSelectService(svc.id)}
                >
                  {svc.name}
                </button>
              ))}
            </div>

            {/* Package Cards */}
            <div className="package-selection-grid">
              {filteredPackages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`pkg-select-card ${selectedPackageId === pkg.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPackageId(pkg.id)}
                >
                  <div className="pkg-select-header">
                    <h3 className="pkg-select-name">{pkg.name}</h3>
                    <div className="pkg-select-price">₹{pkg.price.toLocaleString('en-IN')}</div>
                  </div>

                  <p className="pkg-select-desc">{pkg.description}</p>

                  <div className="pkg-select-meta">
                    <span className="pkg-meta-tag"><Clock className="w-3.5 h-3.5" /> {pkg.duration}</span>
                    <span className="pkg-meta-tag"><Camera className="w-3.5 h-3.5" /> {pkg.deliverables?.photos || 'Photos'}</span>
                  </div>

                  <ul className="pkg-select-features">
                    {pkg.features?.slice(0, 4).map((f, i) => (
                      <li key={i}>
                        <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pkg-select-radio">
                    <div className={`radio-dot ${selectedPackageId === pkg.id ? 'active' : ''}`} />
                    <span>{selectedPackageId === pkg.id ? 'Selected' : 'Select Package'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Photographer Selection */}
            <div className="photographer-selection-section">
              <h3 className="sub-heading">Select Preferred Photographer (Optional)</h3>
              <p className="sub-desc">Choose a dedicated photographer or let our studio assign the best available expert.</p>

              <div className="photog-select-grid">
                <div
                  className={`photog-select-card ${selectedPhotographerId === 'any' ? 'selected' : ''}`}
                  onClick={() => setSelectedPhotographerId('any')}
                >
                  <div className="photog-avatar-placeholder">
                    <Camera className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <div className="photog-name font-semibold">Any Available Photographer</div>
                    <div className="photog-spec text-muted text-xs">Recommended • Fastest Confirmation</div>
                  </div>
                </div>

                {photographers.map(p => (
                  <div
                    key={p.id}
                    className={`photog-select-card ${selectedPhotographerId === p.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPhotographerId(p.id)}
                  >
                    <div className="photog-avatar-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(212, 175, 55, 0.15)', borderRadius: '50%', width: '44px', height: '44px' }}>
                      <span style={{ fontWeight: 700, color: '#D4AF37', fontSize: '1.1rem' }}>{p.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="photog-name font-semibold">{p.name}</div>
                      <div className="photog-spec text-gold text-xs">{p.specialization}</div>
                      <div className="photog-location text-muted text-xs">{p.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="step-actions">
              <button
                type="button"
                className="btn btn-primary btn-next"
                disabled={!selectedPackageId}
                onClick={() => setStep(2)}
              >
                Proceed to Schedule <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 2 && (
          <div className="step-content">
            <h2 className="step-heading">2. Select Date & Slot</h2>
            <p className="step-subheading">
              Studio operating hours are <strong>10:00 AM – 7:00 PM</strong> daily. Bookings must be within 7 days.
            </p>

            <div className="datetime-layout">
              {/* Date Picker */}
              <div className="form-group date-picker-group">
                <label className="form-label">
                  <Calendar className="w-4 h-4 text-gold inline mr-2" />
                  Choose Shoot Date
                </label>
                <input
                  type="date"
                  className="form-input date-input"
                  min={today}
                  max={maxDate}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <span className="input-hint">Appointments available from today until {maxDate}</span>
              </div>

              {/* Time Slots */}
              <div className="form-group">
                <label className="form-label">
                  <Clock className="w-4 h-4 text-gold inline mr-2" />
                  Choose Shoot Time (Business Hours: 10:00 AM – 7:00 PM)
                </label>
                <div className="time-slots-grid">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`time-slot-btn ${selectedTime === time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {formatTime12h(time)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Buffer Policy Notice */}
            <div className="rules-callout">
              <AlertCircle className="w-5 h-5 text-gold flex-shrink-0" />
              <div className="text-sm">
                <strong>Studio Buffer Rule:</strong> A minimum 2-hour buffer is maintained between shoots for each photographer to allow full equipment sterilization, outfit change, and personalized setup.
              </div>
            </div>

            <div className="step-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Packages
              </button>
              <button
                type="button"
                className="btn btn-primary btn-next"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
              >
                Continue to Review <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Personal Details */}
        {step === 3 && (
          <div className="step-content">
            <h2 className="step-heading">3. Customer Details & Confirmation</h2>

            <div className="review-grid">
              {/* Left Column: Customer Form */}
              <div className="customer-details-card">
                <h3 className="sub-heading mb-4">Contact Information</h3>

                <div className="form-group mb-3">
                  <label className="form-label">Parent / Contact Name *</label>
                  <div className="input-wrap">
                    <User className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Email Address *</label>
                  <div className="input-wrap">
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="youremail@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Phone Number *</label>
                  <div className="input-wrap">
                    <Phone className="input-icon" />
                    <input
                      type="tel"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Special Requests / Baby's Age & Themes</label>
                  <textarea
                    className="form-input form-textarea"
                    rows="3"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Tell us about the baby's age, favorite themes, outfit preferences, or any specific requests..."
                  />
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="booking-summary-card">
                <h3 className="sub-heading mb-4">Booking Summary</h3>

                <div className="summary-row">
                  <span className="text-muted">Service</span>
                  <span className="font-semibold text-primary">{selectedService?.name}</span>
                </div>

                <div className="summary-row">
                  <span className="text-muted">Package</span>
                  <span className="font-semibold text-primary">{selectedPackage?.name}</span>
                </div>

                <div className="summary-row">
                  <span className="text-muted">Photographer</span>
                  <span className="font-semibold text-primary">
                    {selectedPhotographer ? selectedPhotographer.name : 'Any Available Photographer'}
                  </span>
                </div>

                <div className="summary-row">
                  <span className="text-muted">Date & Time</span>
                  <span className="font-semibold text-gold">
                    {selectedDate} at {selectedTime ? formatTime12h(selectedTime) : ''}
                  </span>
                </div>

                <div className="summary-row">
                  <span className="text-muted">Duration</span>
                  <span>{selectedPackage?.duration}</span>
                </div>

                <div className="summary-divider" />

                <div className="summary-row total-row">
                  <span className="total-label">Total Package Price</span>
                  <span className="total-price">₹{selectedPackage?.price?.toLocaleString('en-IN')}</span>
                </div>

                <div className="deposit-box">
                  <div className="flex justify-between items-center text-sm font-semibold mb-1">
                    <span>Advance to Lock Slot:</span>
                    <span className="text-gold">₹500</span>
                  </div>
                  <p className="text-xs text-muted">
                    Balance ₹{(Math.max(0, (selectedPackage?.price || 0) - 500))?.toLocaleString('en-IN')} payable on shoot day at studio.
                  </p>

                  {advancePaid ? (
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '10px 12px', borderRadius: '8px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 className="w-5 h-5 text-green flex-shrink-0" style={{ color: '#10b981' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#34d399', fontSize: '0.84rem' }}>Advance Paid (₹500 via UPI Scanner) ✓</div>
                        <div style={{ fontSize: '0.72rem', color: '#9d9da8' }}>Your photoshoot slot priority is locked!</div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="btn btn-outline btn-full"
                      style={{
                        borderColor: 'rgba(212, 175, 55, 0.5)',
                        color: '#D4AF37',
                        marginTop: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '0.82rem',
                        padding: '9px 12px'
                      }}
                    >
                      <QrCode size={16} /> Pay ₹500 Advance with UPI Scanner
                    </button>
                  )}
                </div>

                {/* Studio Policy Reminder */}
                <div className="policy-notice">
                  <ShieldAlert className="w-4 h-4 text-gold flex-shrink-0" />
                  <p className="text-xs text-muted">
                    <strong>Cancellation Terms:</strong> ₹{rules.cancellation_fee?.toLocaleString('en-IN')} cancellation fee applies. ₹{rules.refund_after_cancellation?.toLocaleString('en-IN')} of advance is refunded if cancelled.
                  </p>
                </div>

                <div className="summary-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-full confirm-btn"
                    disabled={submitting}
                    onClick={handleSubmitBooking}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="spinner-sm" /> Confirming Booking...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {advancePaid ? 'Confirm Reservation (Advance Paid ✓)' : 'Confirm & Reserve Session'} <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-full mt-2"
                    onClick={() => setStep(2)}
                  >
                    <ArrowLeft className="w-4 h-4" /> Modify Date/Time
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dummy Payment Scanner Modal */}
        <PaymentScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          amount={500}
          bookingTitle={`${selectedService?.name || 'Photoshoot'} - ${selectedPackage?.name || 'Package'}`}
          onPaymentSuccess={() => {
            setAdvancePaid(true);
            toast.success('Advance payment of ₹500 verified!');
          }}
        />
      </div>
    </div>
  );
};

export default BookShoot;
