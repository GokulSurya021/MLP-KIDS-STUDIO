import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, Camera, AlertTriangle, CheckCircle, XCircle,
  Clock3, Phone, RefreshCw, X, ArrowRight, QrCode
} from 'lucide-react';
import PaymentScannerModal from '../components/PaymentScannerModal';
import './MyBookings.css';

const TIME_SLOTS = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const formatTime12h = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m < 10 ? '0' + m : m} ${period}`;
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [rules, setRules] = useState({ advance_payment: 3000, cancellation_fee: 1000, refund_after_cancellation: 2000 });
  const [paymentModal, setPaymentModal] = useState({ open: false, booking: null });

  const today = new Date().toISOString().split('T')[0];
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 7);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  const fetchBookings = async () => {
    try {
      const [res, rulesRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/rules').catch(() => ({ data: { rules: null } }))
      ]);
      setBookings(res.data?.bookings || []);
      if (rulesRes.data?.rules) {
        setRules(rulesRes.data.rules);
      }
    } catch (err) {
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const openRescheduleModal = (booking) => {
    setActiveBooking(booking);
    setNewDate(booking.date?.split('T')[0] || '');
    setNewTime(booking.time || '');
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) {
      toast.error('Please select both date and time slot');
      return;
    }
    setRescheduling(true);
    try {
      const res = await api.put(`/bookings/${activeBooking._id}/reschedule`, {
        date: newDate,
        time: newTime
      });
      if (res.data.success) {
        toast.success('Shoot rescheduled successfully!');
        setRescheduleModalOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule shoot');
    } finally {
      setRescheduling(false);
    }
  };

  const openCancelModal = (booking) => {
    setActiveBooking(booking);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setCancelling(true);
    try {
      const res = await api.put(`/bookings/${activeBooking._id}/cancel`, {
        reason: cancelReason
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Booking cancelled');
        setCancelModalOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return <span className="status-badge status-confirmed"><CheckCircle className="w-3.5 h-3.5" /> Confirmed</span>;
      case 'Pending':
        return <span className="status-badge status-pending"><Clock3 className="w-3.5 h-3.5" /> Pending Confirmation</span>;
      case 'Completed':
        return <span className="status-badge status-completed"><CheckCircle className="w-3.5 h-3.5" /> Completed</span>;
      case 'Cancelled':
        return <span className="status-badge status-cancelled"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="bookings-page">
      <div className="bookings-container">
        <div className="bookings-header">
          <div>
            <h1 className="bookings-title">My Bookings</h1>
            <p className="bookings-subtitle">Track, reschedule, or manage your photography sessions</p>
          </div>
          <Link to="/book" className="btn btn-primary">
            Book New Session <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading your reservations...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-bookings-card">
            <Camera className="w-16 h-16 text-gold mb-4" />
            <h2>No Bookings Found</h2>
            <p className="text-secondary max-w-md mx-auto mb-6">
              You haven't reserved any photography sessions yet. Explore our packages and book your child's magical milestone shoot today!
            </p>
            <Link to="/book" className="btn btn-primary">
              Browse Packages & Book <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => {
              const canModify = !['Cancelled', 'Completed'].includes(booking.status);
              return (
                <div key={booking._id} className="booking-card">
                  <div className="booking-card-header">
                    <div>
                      <span className="booking-service-badge">{booking.service}</span>
                      <h3 className="booking-card-title">{booking.package}</h3>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="booking-card-body">
                    <div className="booking-meta-grid">
                      <div className="meta-item">
                        <Calendar className="meta-icon text-gold" />
                        <div>
                          <span className="meta-label">Shoot Date</span>
                          <span className="meta-value">{formatDateDisplay(booking.date)}</span>
                        </div>
                      </div>

                      <div className="meta-item">
                        <Clock className="meta-icon text-gold" />
                        <div>
                          <span className="meta-label">Time Slot</span>
                          <span className="meta-value">{formatTime12h(booking.time)}</span>
                        </div>
                      </div>

                      <div className="meta-item">
                        <Camera className="meta-icon text-gold" />
                        <div>
                          <span className="meta-label">Photographer</span>
                          <span className="meta-value">{booking.photographer}</span>
                        </div>
                      </div>

                      <div className="meta-item">
                        <Phone className="meta-icon text-gold" />
                        <div>
                          <span className="meta-label">Contact Phone</span>
                          <span className="meta-value">{booking.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="booking-price-details">
                      <div className="flex justify-between items-center text-sm py-1">
                        <span className="text-muted">Package Total:</span>
                        <span className="font-bold text-primary">₹{booking.packagePrice?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm py-1">
                        <span className="text-muted">Slot Deposit:</span>
                        <span className="text-gold font-semibold">₹{rules.advance_payment?.toLocaleString('en-IN')} (Advance)</span>
                      </div>
                    </div>

                    {booking.specialRequests && (
                      <div className="special-requests-note">
                        <strong>Special Requests:</strong> {booking.specialRequests}
                      </div>
                    )}

                    {booking.cancellationReason && (
                      <div className="cancellation-note">
                        <strong>Cancellation Note:</strong> {booking.cancellationReason} (Fee: ₹500, Refund: ₹1,500)
                      </div>
                    )}
                  </div>

                  {canModify && (
                    <div className="booking-card-footer">
                      {!booking.advancePaid && booking.status !== 'Cancelled' && (
                        <button
                          className="btn btn-gold btn-sm"
                          style={{
                            background: 'linear-gradient(135deg, #D4AF37 0%, #AA8010 100%)',
                            color: '#000',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onClick={() => setPaymentModal({ open: true, booking })}
                        >
                          <QrCode className="w-3.5 h-3.5" /> Pay ₹500 Advance
                        </button>
                      )}

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openRescheduleModal(booking)}
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reschedule Slot
                      </button>

                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => openCancelModal(booking)}
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reschedule Modal */}
        {rescheduleModalOpen && activeBooking && (
          <div className="modal-backdrop">
            <div className="modal-box">
              <div className="modal-header">
                <h3>Reschedule Session</h3>
                <button className="modal-close" onClick={() => setRescheduleModalOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit}>
                <div className="modal-body">
                  <p className="text-secondary text-sm mb-4">
                    Rescheduling for <strong>{activeBooking.package}</strong>. Choose a new slot within 7 days.
                  </p>

                  <div className="form-group mb-4">
                    <label className="form-label">New Shoot Date</label>
                    <input
                      type="date"
                      className="form-input"
                      min={today}
                      max={maxDate}
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group mb-4">
                    <label className="form-label">New Time Slot (10:00 AM – 7:00 PM)</label>
                    <div className="time-slots-grid">
                      {TIME_SLOTS.map((time) => (
                        <button
                          key={time}
                          type="button"
                          className={`time-slot-btn ${newTime === time ? 'selected' : ''}`}
                          onClick={() => setNewTime(time)}
                        >
                          {formatTime12h(time)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setRescheduleModalOpen(false)}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={rescheduling || !newDate || !newTime}
                  >
                    {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {cancelModalOpen && activeBooking && (
          <div className="modal-backdrop">
            <div className="modal-box">
              <div className="modal-header">
                <h3>Cancel Booking</h3>
                <button className="modal-close" onClick={() => setCancelModalOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCancelSubmit}>
                <div className="modal-body">
                  <div className="cancel-alert-box">
                    <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-warning text-sm">Studio Cancellation Policy</h4>
                      <p className="text-xs text-muted mt-1">
                        As per MLP Kids Studio rules, a cancellation fee of <strong>₹{rules.cancellation_fee?.toLocaleString('en-IN')}</strong> is deducted from the ₹{rules.advance_payment?.toLocaleString('en-IN')} deposit. You will receive a refund of <strong>₹{rules.refund_after_cancellation?.toLocaleString('en-IN')}</strong> within 3 business days.
                      </p>
                    </div>
                  </div>

                  <div className="form-group mt-4">
                    <label className="form-label">Reason for Cancellation (Optional)</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Let us know why you need to cancel..."
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCancelModalOpen(false)}
                  >
                    Keep Booking
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* UPI Payment Scanner Modal */}
        <PaymentScannerModal
          isOpen={paymentModal.open}
          onClose={() => setPaymentModal({ open: false, booking: null })}
          amount={500}
          bookingTitle={paymentModal.booking ? `${paymentModal.booking.service} - ${paymentModal.booking.package}` : 'Shoot Advance'}
          onPaymentSuccess={async () => {
            if (paymentModal.booking) {
              try {
                await api.put(`/bookings/${paymentModal.booking._id}/pay-advance`);
                toast.success('Advance payment of ₹500 verified via UPI Scanner!');
                fetchBookings();
              } catch (err) {
                toast.error('Payment verified locally. Refreshing status...');
                fetchBookings();
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default MyBookings;
