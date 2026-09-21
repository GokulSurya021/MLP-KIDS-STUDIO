import { useState } from 'react';
import { Link } from 'react-router-dom';
import PaymentScannerModal from '../components/PaymentScannerModal';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  QrCode, 
  Sparkles, 
  ExternalLink,
  Check,
  RefreshCw,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const TestPayment = () => {
  const [modalOpen, setModalOpen] = useState(true);
  const [testDone, setTestDone] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const handleTestSuccess = (receiptData) => {
    setReceipt(receiptData);
    setTestDone(true);
    toast.success('₹1 Trust Confirmation Successful! Live Merchant verified.');
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 20px 60px' }}>
      <div className="auth-card" style={{ maxWidth: '520px', textAlign: 'center' }}>
        
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon-badge" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', width: '56px', height: '56px' }}>
            <Award size={28} />
          </div>
          <h1 className="auth-title">₹1 Trust Confirmation</h1>
          <p className="auth-subtitle">
            Verify real-time UPI QR connectivity, merchant trust, and Razorpay gateway settlement with a ₹1 test.
          </p>
        </div>

        {testDone && receipt ? (
          <div className="forgot-success-box" style={{ padding: '10px 0' }}>
            <div className="success-badge-glow" style={{ width: '68px', height: '68px' }}>
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="success-heading" style={{ fontSize: '1.35rem' }}>Trust Verification Confirmed!</h2>
            <p className="success-desc">
              Your test payment of <strong>₹1.00</strong> was captured successfully. Merchant connectivity with <strong>MLP Kids Studio</strong> is 100% verified.
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
              textAlign: 'left',
              width: '100%',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              margin: '6px 0 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Test Amount</span>
                <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>₹1.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Razorpay Ref</span>
                <span style={{ fontFamily: 'monospace', color: '#0c68e9', fontWeight: 600 }}>{receipt.paymentId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>UPI App / Mode</span>
                <span style={{ fontWeight: 600 }}>{receipt.method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Status</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>VERIFIED & SETTLED ✓</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <Link to="/book" className="btn btn-primary btn-full">
                Book Your Photo Shoot with Confidence <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={() => setModalOpen(true)}
              >
                <RefreshCw size={14} /> Run ₹1 Test Again
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Trust highlights banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(12, 104, 233, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)',
              border: '1.5px solid rgba(12, 104, 233, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0c68e9', fontWeight: 700 }}>
                  Live Test Order
                </span>
                <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                  Micro Test
                </span>
              </div>

              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                MLP Kids Studio • Trust Verification
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>Test Amount:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>₹1.00</span>
              </div>
            </div>

            {/* Steps Guide */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.82rem',
              color: '#334155'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#0c68e9', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</span>
                <span>Open PhonePe, Google Pay, or Paytm on mobile.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#0c68e9', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</span>
                <span>Scan the QR code and pay exactly <strong>₹1.00</strong>.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#0c68e9', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>3</span>
                <span>Click verify to receive your live Razorpay receipt!</span>
              </div>
            </div>

            {/* Launch Button */}
            <button
              type="button"
              className="btn btn-primary btn-full"
              style={{
                background: 'linear-gradient(135deg, #0c68e9 0%, #059669 100%)',
                boxShadow: '0 4px 14px rgba(12, 104, 233, 0.35)',
                padding: '14px',
                fontSize: '0.98rem'
              }}
              onClick={() => setModalOpen(true)}
            >
              <QrCode size={18} /> Open ₹1 Razorpay QR Portal
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '0.76rem', color: '#64748b' }}>
              <span>✓ PhonePe QR</span>
              <span>•</span>
              <span>✓ GPay / Paytm / BHIM</span>
              <span>•</span>
              <span>✓ 256-Bit SSL</span>
            </div>

            <div className="auth-footer" style={{ marginTop: '8px' }}>
              <Link to="/book" className="back-link">
                <ArrowLeft size={14} /> Back to Booking Page
              </Link>
            </div>
          </div>
        )}

        {/* Embedded Razorpay Payment Gateway Modal for ₹1 */}
        <PaymentScannerModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          amount={1}
          bookingTitle="Trust Confirmation Micro-Test (₹1)"
          onPaymentSuccess={handleTestSuccess}
        />
      </div>
    </div>
  );
};

export default TestPayment;
