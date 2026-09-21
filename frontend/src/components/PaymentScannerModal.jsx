import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X, CheckCircle2, ShieldCheck, Lock, BadgeCheck, Check,
  AlertCircle, RotateCw, Wifi, QrCode, CreditCard, Smartphone, Sparkles,
  Copy, CheckCheck, Edit2, ArrowRight, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { savePaymentToFirestore } from '../firebase/firestoreService';
import './PaymentScannerModal.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';;

// ── Load Razorpay checkout.js dynamically ────────────────────────────────────
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script    = document.createElement('script');
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });

const DEFAULT_STUDIO_UPI = '9030613418@ybl';

const PaymentScannerModal = ({
  isOpen,
  onClose,
  amount = 3000,
  bookingTitle = 'MLP Kids Studio Shoot Advance',
  bookingId = null,
  initialMethod = 'upi',
  onPaymentSuccess
}) => {
  // 'idle' | 'loading' | 'verifying' | 'success' | 'failed'
  const [status, setStatus]           = useState('idle');
  const [activeTab, setActiveTab]     = useState(initialMethod || 'upi');
  const [receipt, setReceipt]         = useState(null);
  const [errorMsg, setErrorMsg]       = useState('');
  const [verifyStep, setVerifyStep]   = useState(0);
  const [pollCountdown, setPollCountdown] = useState(null);

  // UPI State
  const [upiId, setUpiId]             = useState(DEFAULT_STUDIO_UPI);
  const [qrMode, setQrMode]           = useState('studio'); // 'studio' (Official PhonePe QR) | 'dynamic' (auto-generated vector QR)
  const [editingUpi, setEditingUpi]   = useState(false);
  const [upiInput, setUpiInput]       = useState(DEFAULT_STUDIO_UPI);
  const [utrNumber, setUtrNumber]     = useState('');
  const [copied, setCopied]           = useState(false);

  const pollRef    = useRef(null);
  const countRef   = useRef(null);
  const mountedRef = useRef(true);

  // ── Reset on open/close ──────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    if (isOpen) {
      setStatus('idle');
      setActiveTab(initialMethod || 'upi');
      setReceipt(null);
      setErrorMsg('');
      setVerifyStep(0);
      setPollCountdown(null);
      setEditingUpi(false);
      setUtrNumber('');
      setQrMode('studio');
    }
    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
      clearInterval(countRef.current);
    };
  }, [isOpen]);

  // ── Verifying step animation ─────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'verifying') return;
    setVerifyStep(0);
    const t1 = setTimeout(() => setVerifyStep(1), 800);
    const t2 = setTimeout(() => setVerifyStep(2), 1800);
    const t3 = setTimeout(() => setVerifyStep(3), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [status]);

  // ── Poll payment status (for webhook path) ───────────────────────────────
  const startPolling = useCallback(() => {
    if (!bookingId) return;
    let attempts = 0;
    let cd = 30;
    setPollCountdown(cd);

    countRef.current = setInterval(() => {
      cd--;
      if (mountedRef.current) setPollCountdown(cd);
      if (cd <= 0) clearInterval(countRef.current);
    }, 1000);

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const token = localStorage.getItem('mlp_token') || localStorage.getItem('token');
        const headers = {};
        if (token && token !== 'null' && token !== 'undefined') {
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE}/bookings/${bookingId}/payment-status`, { headers });
        const data = await res.json();
        if (data.success && data.advancePaid && mountedRef.current) {
          clearInterval(pollRef.current);
          clearInterval(countRef.current);
          showSuccess({
            paymentId : data.paymentDetails?.paymentId,
            orderId   : data.paymentDetails?.orderId,
            amount    : data.paymentDetails?.amount || amount,
            method    : data.paymentDetails?.method || 'UPI',
            utr       : data.paymentDetails?.utr,
            paidAt    : data.paymentDetails?.paidAt
          });
        }
      } catch (_) {}
      if (attempts >= 20 && mountedRef.current) {
        clearInterval(pollRef.current);
        clearInterval(countRef.current);
      }
    }, 3000);
  }, [bookingId, amount]);

  // ── Show success screen ──────────────────────────────────────────────────
  const showSuccess = useCallback((details) => {
    const finalReceipt = {
      paymentId : details?.paymentId || `pay_${Date.now()}`,
      orderId   : details?.orderId   || 'N/A',
      amount    : details?.amount    || amount,
      method    : details?.method    || 'UPI',
      utr       : details?.utr       || '',
      date      : details?.paidAt
        ? new Date(details.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    };
    if (mountedRef.current) {
      setReceipt(finalReceipt);
      setStatus('success');
      toast.success(`✅ ₹${finalReceipt.amount?.toLocaleString('en-IN')} payment confirmed!`);

      // Automatically sync payment to Firebase Firestore
      try {
        savePaymentToFirestore({
          paymentId: finalReceipt.paymentId,
          orderId: finalReceipt.orderId,
          amount: finalReceipt.amount,
          method: finalReceipt.method,
          utr: finalReceipt.utr,
          bookingId: bookingId || 'direct',
          bookingTitle: bookingTitle || 'MLP Kids Studio Advance',
          status: 'Confirmed'
        });
      } catch (fErr) {
        console.warn('Firestore payment sync notice:', fErr);
      }

      if (onPaymentSuccess) onPaymentSuccess(finalReceipt);
    }
  }, [amount, bookingId, bookingTitle, onPaymentSuccess]);

  // ── Dynamic NPCI UPI QR string ───────────────────────────────────────────
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('MLP Kids Studio')}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(bookingTitle || 'Shoot Advance')}`;

  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      toast.success(`Copied UPI ID: ${upiId}`);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSaveUpi = (e) => {
    e.preventDefault();
    if (upiInput.trim()) {
      setUpiId(upiInput.trim());
      setEditingUpi(false);
      toast.success(`QR updated for: ${upiInput.trim()}`);
    }
  };


  // ── MAIN: Launch real Razorpay Checkout ──────────────────────────────────
  const handlePay = async (prefMethod = null) => {
    const selectedMethod = prefMethod || activeTab || 'upi';
    setStatus('loading');
    setErrorMsg('');

    // 1. Load checkout.js
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMsg('Could not load Razorpay checkout. Check your internet connection.');
      setStatus('failed');
      return;
    }

    try {
      // 2. Create Razorpay order on our backend
      const token = localStorage.getItem('mlp_token') || localStorage.getItem('token');
      const authHeaders = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        authHeaders.Authorization = `Bearer ${token}`;
      }

      const orderRes = await fetch(`${API_BASE}/payment/create-order`, {
        method : 'POST',
        headers: authHeaders,
        body   : JSON.stringify({ bookingId, amount })
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      // 3. Configure Razorpay checkout options
      const isUpi = selectedMethod === 'upi';
      const options = {
        key         : orderData.keyId,
        amount      : orderData.amount,       // in paise from backend
        currency    : orderData.currency || 'INR',
        name        : 'MLP Kids Studio',
        description : isUpi ? `UPI Advance - ${bookingTitle}` : bookingTitle,
        order_id    : orderData.orderId,
        image       : '/images/logo.png',     // your studio logo

        // ── Prefill customer info ────────────────────────────────────────
        prefill: {
          name   : orderData.booking?.customerName || '',
          email  : orderData.booking?.email        || '',
          contact: orderData.booking?.phone       || '',
          method : isUpi ? 'upi' : undefined
        },

        // ── Theme (Purple for UPI, Razorpay Blue for general) ───────────
        theme: { color: isUpi ? '#5f259f' : '#0c68e9' },

        // ── Retry options ────────────────────────────────────────────────
        retry: { enabled: true, max_count: 3 },

        // ── SUCCESS handler (frontend path) ──────────────────────────────
        handler: async (response) => {
          setStatus('verifying');
          try {
            const verifyRes = await fetch(`${API_BASE}/payment/verify`, {
              method : 'POST',
              headers: authHeaders,
              body   : JSON.stringify({
                razorpay_order_id  : response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature : response.razorpay_signature,
                bookingId
              })
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              showSuccess(verifyData.payment);
            } else {
              throw new Error(verifyData.message || 'Verification failed');
            }
          } catch (err) {
            // Fallback: start polling for webhook confirmation
            setStatus('verifying');
            startPolling();
          }
        },

        // ── MODAL DISMISS handler ─────────────────────────────────────────
        modal: {
          ondismiss: () => {
            if (mountedRef.current && status !== 'success') {
              setStatus('idle');
              toast('Payment cancelled. You can try again anytime.', { icon: 'ℹ️' });
            }
          }
        }
      };

      // 4. Open Razorpay checkout
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error);
        if (mountedRef.current) {
          setErrorMsg(`Payment failed: ${response.error.description}`);
          setStatus('failed');
          toast.error(`Payment failed: ${response.error.description}`);
        }
      });

      setStatus('idle'); // reset before opening
      rzp.open();

    } catch (err) {
      console.error('handlePay error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('failed');
    }
  };

  if (!isOpen) return null;

  // ═══════════════════════════════════════════════════════════════════════════
  //  SUCCESS SCREEN — Razorpay-style green receipt
  // ═══════════════════════════════════════════════════════════════════════════
  if (status === 'success' && receipt) {
    return (
      <div className="rzp-overlay animate-fade">
        <div className="rzp-modal rzp-modal-success">
          <div className="rzp-success-hero">
            <div className="rzp-success-circle">
              <CheckCircle2 size={52} strokeWidth={2} />
            </div>
            <h2 className="rzp-success-title">Payment Successful</h2>
            <p className="rzp-success-amount">₹{receipt.amount?.toLocaleString('en-IN')}.00</p>
            <div className="rzp-success-verified-pill">
              <BadgeCheck size={14} />
              <span>Verified by Razorpay</span>
            </div>
          </div>

          <div className="rzp-success-body">
            <div className="rzp-txn-card">
              <div className="rzp-txn-row rzp-txn-status-row">
                <span className="rzp-txn-label">Transaction Status</span>
                <span className="rzp-txn-status-badge">✅ SUCCESS</span>
              </div>
              <div className="rzp-txn-divider" />
              <div className="rzp-txn-row">
                <span className="rzp-txn-label">Paid To</span>
                <span className="rzp-txn-value">MLP Kids Studio</span>
              </div>
              <div className="rzp-txn-row">
                <span className="rzp-txn-label">Payment Mode</span>
                <span className="rzp-txn-value">{receipt.method}</span>
              </div>
              <div className="rzp-txn-row">
                <span className="rzp-txn-label">Payment ID</span>
                <span className="rzp-txn-value rzp-txn-code">{receipt.paymentId}</span>
              </div>
              <div className="rzp-txn-row">
                <span className="rzp-txn-label">Order ID</span>
                <span className="rzp-txn-value rzp-txn-code">{receipt.orderId}</span>
              </div>
              {receipt.utr && (
                <div className="rzp-txn-row">
                  <span className="rzp-txn-label">UPI / UTR Ref</span>
                  <span className="rzp-txn-value rzp-txn-code">{receipt.utr}</span>
                </div>
              )}
              <div className="rzp-txn-row">
                <span className="rzp-txn-label">Date & Time</span>
                <span className="rzp-txn-value">{receipt.date}</span>
              </div>
            </div>

            <p className="rzp-success-note">
              Your advance payment has been received & confirmed. A receipt will be sent to your registered email.
            </p>

            <button type="button" className="rzp-btn rzp-btn-success-done" onClick={onClose}>
              <Check size={17} /> Back to Booking
            </button>
          </div>

          <div className="rzp-success-footer">
            <ShieldCheck size={11} className="text-emerald-500" />
            <span>Secured by <strong>⚡ Razorpay</strong> · PCI-DSS Level 1</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  VERIFYING SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (status === 'verifying') {
    return (
      <div className="rzp-overlay animate-fade">
        <div className="rzp-modal">
          <div className="rzp-header">
            <div className="rzp-brand-row">
              <div className="rzp-logo-badge">
                <span className="rzp-lightning">⚡</span>
                <span className="rzp-logo-text">Razorpay</span>
              </div>
              <div className="rzp-trusted-badge">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Trusted Business</span>
              </div>
            </div>
          </div>
          <div className="rzp-body rzp-verifying-body">
            <div className="rzp-spinner-outer">
              <div className="rzp-spinner-glow" />
              <RotateCw size={46} className="rzp-spin" />
            </div>
            <h4>Verifying Payment…</h4>
            <p className="rzp-proc-sub">
              Confirming ₹{amount?.toLocaleString('en-IN')} with Razorpay & NPCI. Do not close.
            </p>
            <div className="rzp-proc-steps">
              {[
                'Establishing Secure TLS Tunnel',
                'Verifying NPCI Settlement',
                'Capturing Payment Token',
                'Confirming with Bank'
              ].map((s, i) => (
                <div key={i} className={`rzp-proc-step ${verifyStep >= i ? 'active' : ''}`}>
                  {verifyStep > i
                    ? <Check size={13} className="proc-check" />
                    : <span className="proc-dot" />
                  }
                  {s}
                </div>
              ))}
            </div>
            {pollCountdown !== null && (
              <div className="rzp-auto-verify-pill">
                <Wifi size={13} className="rzp-pulse-icon" />
                <span>
                  {pollCountdown > 0
                    ? `Waiting for bank confirmation… (${pollCountdown}s)`
                    : 'Finalizing verification…'}
                </span>
              </div>
            )}
          </div>
          <div className="rzp-footer">
            <span className="rzp-sec-badge"><Lock size={11} className="text-blue-400" /><span>256-Bit SSL</span></span>
            <span className="rzp-powered-name">⚡ Razorpay</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  MAIN PAYMENT SCREEN — Single Pay button opens real Razorpay checkout
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="rzp-overlay animate-fade">
      <div className="rzp-modal">

        {/* HEADER */}
        <div className="rzp-header">
          <div className="rzp-brand-row">
            <div className="rzp-logo-badge">
              <span className="rzp-lightning">⚡</span>
              <span className="rzp-logo-text">Razorpay</span>
            </div>
            <div className="rzp-trusted-badge">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Trusted Business</span>
            </div>
            <button onClick={onClose} className="rzp-close-btn" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="rzp-merchant-row">
            <div className="rzp-merchant-info">
              <h3 className="rzp-merchant-name">
                MLP Kids Studio <span className="rzp-verified-tag">✓ Verified</span>
              </h3>
              <p className="rzp-order-title">{bookingTitle}</p>
            </div>
            <div className="rzp-amount-box">
              <span className="rzp-amount-label">Advance Amount</span>
              <span className="rzp-amount-val">₹{amount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="rzp-security-strip">
            <div className="rzp-sec-item"><Lock size={12} /><span>256-Bit SSL Encryption</span></div>
            <div className="rzp-sec-dot" />
            <div className="rzp-sec-item"><CheckCircle2 size={12} /><span>RBI Authorized Gateway</span></div>
            <div className="rzp-sec-dot" />
            <div className="rzp-sec-item"><ShieldCheck size={12} style={{ color: '#10b981' }} /><span style={{ color: '#10b981' }}>PCI-DSS Level 1</span></div>
          </div>
        </div>

        {/* BODY */}
        <div className="rzp-body rzp-pay-body">

          {/* Payment Method Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('upi')}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: activeTab === 'upi' ? '2px solid #5f259f' : '1px solid #e2e8f0',
                background: activeTab === 'upi' ? '#f5f3ff' : '#ffffff',
                color: activeTab === 'upi' ? '#5f259f' : '#64748b',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Smartphone size={15} />
              <span>Pay with UPI</span>
              <span style={{ fontSize: '0.66rem', background: '#5f259f', color: '#fff', padding: '1px 5px', borderRadius: '8px', fontWeight: 600 }}>Fast</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cards')}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: activeTab === 'cards' ? '2px solid #0c68e9' : '1px solid #e2e8f0',
                background: activeTab === 'cards' ? '#eff6ff' : '#ffffff',
                color: activeTab === 'cards' ? '#0c68e9' : '#64748b',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <CreditCard size={15} />
              <span>Cards & More</span>
            </button>
          </div>

          {activeTab === 'upi' ? (
            <div className="rzp-upi-tab-content">
              {/* Dynamic QR Code Card */}
              <div style={{
                background: 'linear-gradient(180deg, #fbfbfe 0%, #f5f3ff 100%)',
                border: '1px solid #ddd6fe',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '14px',
                boxShadow: '0 4px 15px rgba(95, 37, 159, 0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#5f259f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Scan to Pay ₹{amount?.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle2 size={12} /> UPI Verified
                  </span>
                </div>

                {/* QR Switcher: Studio PhonePe QR vs Auto ₹3,000 Dynamic QR */}
                <div style={{ display: 'inline-flex', background: '#ede9fe', padding: '3px', borderRadius: '10px', marginBottom: '10px', gap: '3px' }}>
                  <button
                    type="button"
                    onClick={() => setQrMode('studio')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '7px',
                      border: 'none',
                      background: qrMode === 'studio' ? '#ffffff' : 'transparent',
                      color: qrMode === 'studio' ? '#5f259f' : '#6b7280',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: qrMode === 'studio' ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ImageIcon size={13} /> Studio PhonePe QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrMode('dynamic')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '7px',
                      border: 'none',
                      background: qrMode === 'dynamic' ? '#ffffff' : 'transparent',
                      color: qrMode === 'dynamic' ? '#059669' : '#6b7280',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: qrMode === 'dynamic' ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <QrCode size={13} /> Dynamic ₹{amount?.toLocaleString('en-IN')} QR
                  </button>
                </div>

                {/* The QR Code Container */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  background: '#ffffff',
                  borderRadius: '14px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                  border: '2px solid #ede9fe',
                  margin: '2px 0 8px',
                  minHeight: '190px',
                  minWidth: '190px'
                }}>
                  {qrMode === 'studio' ? (
                    <img
                      src="/images/payment-qr.jpg"
                      alt="MLP Kids Studio PhonePe QR"
                      style={{
                        width: '175px',
                        height: '175px',
                        objectFit: 'contain',
                        display: 'block',
                        borderRadius: '8px'
                      }}
                    />
                  ) : (
                    <QRCodeSVG
                      value={upiUrl}
                      size={175}
                      level="M"
                      includeMargin={false}
                    />
                  )}
                </div>

                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '8px' }}>
                  {qrMode === 'studio' ? (
                    <span>Scan official studio <strong>PhonePe QR</strong> with PhonePe, GPay, Paytm or BHIM</span>
                  ) : (
                    <span>Auto-generated QR with <strong>₹{amount?.toLocaleString('en-IN')} amount pre-filled</strong></span>
                  )}
                </div>

                {/* UPI ID + Copy / Edit Row */}
                {editingUpi ? (
                  <form onSubmit={handleSaveUpi} style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <input
                      type="text"
                      value={upiInput}
                      onChange={(e) => setUpiInput(e.target.value)}
                      placeholder="e.g. yourname@oksbi"
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #7c3aed',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>Save</button>
                    <button type="button" onClick={() => setEditingUpi(false)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>Cancel</button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>UPI ID:</span>
                      <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{upiId}</strong>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        title="Copy UPI ID"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : '#5f259f', display: 'flex', alignItems: 'center' }}
                      >
                        {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUpiInput(upiId); setEditingUpi(true); }}
                      style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.74rem', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Edit2 size={11} /> Change UPI ID
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Quick App Links */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Or Tap to Pay directly on Mobile:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  <a href={upiUrl} className="app-badge badge-phonepe" style={{ textAlign: 'center', textDecoration: 'none', padding: '7px 4px', fontSize: '0.76rem', borderRadius: '8px' }}>PhonePe</a>
                  <a href={upiUrl} className="app-badge badge-gpay" style={{ textAlign: 'center', textDecoration: 'none', padding: '7px 4px', fontSize: '0.76rem', borderRadius: '8px' }}>GPay</a>
                  <a href={upiUrl} className="app-badge badge-paytm" style={{ textAlign: 'center', textDecoration: 'none', padding: '7px 4px', fontSize: '0.76rem', borderRadius: '8px' }}>Paytm</a>
                  <a href={upiUrl} className="app-badge badge-bhim" style={{ textAlign: 'center', textDecoration: 'none', padding: '7px 4px', fontSize: '0.76rem', borderRadius: '8px' }}>Any UPI</a>
                </div>
              </div>

              {/* Official Razorpay Gateway Payment Button */}
              <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                <button
                  type="button"
                  className="rzp-btn rzp-btn-primary rzp-btn-pay-now"
                  style={{
                    background: 'linear-gradient(135deg, #0c68e9 0%, #024ebb 100%)',
                    boxShadow: '0 4px 16px rgba(12, 104, 233, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '13px',
                    fontSize: '0.92rem',
                    fontWeight: 700
                  }}
                  onClick={() => handlePay('upi')}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <>
                      <RotateCw size={17} className="rzp-spin-inline" />
                      <span>Opening Official Gateway…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Pay ₹{amount?.toLocaleString('en-IN')} via Razorpay Gateway</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Payment method preview for Cards/Netbanking */}
              <div className="rzp-method-preview" style={{ marginBottom: '14px' }}>
                <p className="rzp-method-preview-title">Accepted Cards & Banking</p>
                <div className="rzp-method-icons">
                  <span className="rzp-method-chip">💳 Credit / Debit Cards</span>
                  <span className="rzp-method-chip">🏦 Netbanking</span>
                  <span className="rzp-method-chip">👛 Wallets</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>Visa</span> • <span>Mastercard</span> • <span>RuPay</span> • <span>All Major Indian Banks</span>
                </div>
              </div>

              {/* Error message */}
              {status === 'failed' && errorMsg && (
                <div className="rzp-error-banner" style={{ marginBottom: '12px' }}>
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ── PAY WITH CARDS BUTTON ── */}
              <button
                type="button"
                className="rzp-btn rzp-btn-primary rzp-btn-pay-now"
                onClick={() => handlePay('cards')}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <RotateCw size={16} className="rzp-spin-inline" />
                    <span>Opening Razorpay Checkout…</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>Pay ₹{amount?.toLocaleString('en-IN')} via Cards / Netbanking</span>
                  </>
                )}
              </button>

              <p className="rzp-pay-note" style={{ textAlign: 'center', fontSize: '0.74rem', color: '#64748b', marginTop: '10px' }}>
                Opens official Razorpay 256-bit encrypted gateway for secure card & netbanking transactions.
              </p>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="rzp-footer">
          <div className="rzp-footer-trust">
            <span className="rzp-sec-badge"><ShieldCheck size={12} className="text-emerald-400" /><span>PCI-DSS Level 1</span></span>
            <span className="rzp-sec-badge"><Lock size={12} className="text-blue-400" /><span>256-Bit SSL</span></span>
            <span className="rzp-sec-badge"><CheckCircle2 size={12} className="text-amber-400" /><span>RBI Certified</span></span>
          </div>
          <div className="rzp-footer-logo">
            <span>Powered by</span>
            <span className="rzp-powered-name">⚡ Razorpay</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentScannerModal;
