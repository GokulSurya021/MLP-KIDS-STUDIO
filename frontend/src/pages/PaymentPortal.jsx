import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { launchRazorpayGateway } from '../services/razorpayService';
import { ShieldCheck, Lock, CheckCircle2, ArrowRight, ArrowLeft, QrCode, CreditCard, Building2, Sparkles, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const PaymentPortal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const bookingId = queryParams.get('bookingId') || location.state?.bookingId || '';
  const initialAmount = Number(queryParams.get('amount')) || location.state?.amount || 3000;
  const initialTitle = queryParams.get('title') || location.state?.title || 'MLP Kids Studio Shoot Advance';

  const [amount, setAmount] = useState(initialAmount);
  const [bookingTitle, setBookingTitle] = useState(initialTitle);
  const [paying, setPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    if (bookingId) {
      api.get(`/bookings/${bookingId}`)
        .then(res => {
          if (res.data?.booking) {
            const b = res.data.booking;
            setBookingTitle(`${b.service} - ${b.package}`);
            if (b.advancePaid) {
              setPaymentDone(true);
            }
          }
        })
        .catch(() => {});
    }
  }, [bookingId]);

  const handlePaymentSuccess = async (receipt) => {
    setReceiptData(receipt);
    setPaymentDone(true);

    if (bookingId) {
      try {
        await api.put(`/bookings/${bookingId}/pay-advance`, {
          paymentId: receipt.paymentId,
          orderId: receipt.orderId,
          method: receipt.method,
          utr: receipt.utr,
          amount: receipt.amount
        });
        toast.success('Advance payment officially confirmed on your booking!');
      } catch (err) {
        console.error('Failed to update booking on server:', err);
      }
    }
  };

  const handleLaunchPayment = (preferredMethod = null) => {
    setPaying(true);
    launchRazorpayGateway({
      amount,
      bookingId,
      bookingTitle,
      preferredMethod,
      onSuccess: (receipt) => {
        setPaying(false);
        handlePaymentSuccess(receipt);
        toast.success(`Payment of ₹${amount?.toLocaleString('en-IN')} confirmed via Razorpay!`);
      },
      onFailure: (err) => {
        setPaying(false);
        toast.error(err.description || err.message || 'Payment cancelled or failed');
      },
      onDismiss: () => {
        setPaying(false);
      }
    }).catch((err) => {
      setPaying(false);
      toast.error(err.message || 'Could not launch Razorpay Gateway');
    });
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card" style={{ maxWidth: '520px', textAlign: 'center' }}>
        <div className="auth-header">
          <div className="auth-icon-badge" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#0c68e9' }}>
            <ShieldCheck size={28} />
          </div>
          <h1 className="auth-title">Trusted Razorpay Portal</h1>
          <p className="auth-subtitle">
            Official instant advance payment portal for MLP Kids Studio photo shoots.
          </p>
        </div>

        {paymentDone ? (
          <div className="forgot-success-box" style={{ padding: '20px 0' }}>
            <div className="success-badge-glow">
              <CheckCircle2 size={44} className="text-emerald-500" />
            </div>
            <h2 className="success-heading">Payment Confirmed!</h2>
            <p className="success-desc">
              Thank you! Your advance payment of <strong>₹{amount?.toLocaleString('en-IN')}</strong> has been securely captured via Razorpay.
            </p>
            {receiptData?.paymentId && (
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '10px 0 20px', fontSize: '0.85rem' }}>
                <div>Razorpay Ref: <strong style={{ color: '#0c68e9', fontFamily: 'monospace' }}>{receiptData.paymentId}</strong></div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <Link to="/my-bookings" className="btn btn-primary btn-full">
                View My Bookings <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Summary</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{bookingTitle}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '0.88rem', color: '#475569' }}>Total Advance Due:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c68e9' }}>₹{amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* ── OPTION 1: PAY WITH UPI (Highlighted Primary) ── */}
            <button
              type="button"
              className="btn btn-primary btn-full"
              disabled={paying}
              style={{
                background: 'linear-gradient(135deg, #0c68e9 0%, #024ebb 100%)',
                boxShadow: '0 6px 18px rgba(12, 104, 233, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '1rem',
                fontWeight: 700,
                padding: '14px'
              }}
              onClick={() => handleLaunchPayment('upi')}
            >
              {paying ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCw size={18} className="spin" /> Opening Razorpay Gateway…
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} />
                  <span>Pay ₹{amount?.toLocaleString('en-IN')} via Official Gateway (UPI)</span>
                </span>
              )}
            </button>

            {/* UPI Quick Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', padding: '2px 0' }}>
              <span style={{ fontSize: '0.74rem', background: '#f3e8ff', color: '#6b21a8', padding: '3px 9px', borderRadius: '12px', fontWeight: 600 }}>PhonePe</span>
              <span style={{ fontSize: '0.74rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 9px', borderRadius: '12px', fontWeight: 600 }}>Google Pay</span>
              <span style={{ fontSize: '0.74rem', background: '#e0f2fe', color: '#0284c7', padding: '3px 9px', borderRadius: '12px', fontWeight: 600 }}>Paytm</span>
              <span style={{ fontSize: '0.74rem', background: '#fef3c7', color: '#b45309', padding: '3px 9px', borderRadius: '12px', fontWeight: 600 }}>BHIM QR</span>
            </div>

            {/* ── OPTION 2: PAY WITH CARDS / NETBANKING ── */}
            <button
              type="button"
              className="btn btn-outline btn-full"
              disabled={paying}
              style={{
                borderColor: '#cbd5e1',
                color: '#334155',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                padding: '11px'
              }}
              onClick={() => handleLaunchPayment('card')}
            >
              <CreditCard size={16} /> Pay via Cards / Netbanking / Wallets
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '0.74rem', color: '#64748b' }}>
              <span>✓ 256-Bit SSL</span>
              <span>•</span>
              <span>✓ Official Razorpay Gateway</span>
              <span>•</span>
              <span>✓ Instant Receipt</span>
            </div>

            <div className="auth-footer" style={{ marginTop: '8px' }}>
              <Link to="/" className="back-link">
                <ArrowLeft size={14} /> Return to Studio Homepage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPortal;
