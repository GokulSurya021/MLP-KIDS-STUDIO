import { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  Camera,
  RotateCw,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import './PaymentScannerModal.css';

const PaymentScannerModal = ({
  isOpen,
  onClose,
  amount = 500,
  bookingTitle = 'MLP Kids Studio Shoot Advance',
  onPaymentSuccess
}) => {
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, scanning, processing, success
  const [activeMode, setActiveMode] = useState('qr'); // qr, camera
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraDetected, setCameraDetected] = useState(false);

  const upiId = 'mlpkidsstudio@upi';

  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle');
      setCameraActive(false);
      setCameraDetected(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulatePayment = () => {
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
      toast.success('Payment Received Successfully! ₹' + amount);
      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        onClose();
      }, 1400);
    }, 1800);
  };

  const handleStartCamera = () => {
    setActiveMode('camera');
    setCameraActive(true);
    // Simulate auto-detecting QR code after 2.5 seconds
    setTimeout(() => {
      setCameraDetected(true);
      setTimeout(() => {
        handleSimulatePayment();
      }, 1000);
    }, 2200);
  };

  return (
    <div className="scanner-overlay animate-fade">
      <div className="scanner-modal">
        {/* Header */}
        <div className="scanner-header">
          <div className="scanner-header-title">
            <div className="scanner-icon-badge">
              <QrCode size={20} />
            </div>
            <div>
              <h3>UPI Payment Scanner</h3>
              <p className="scanner-subtitle">Instant Advance Payment Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="scanner-close-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="scanner-amount-banner">
          <div className="amount-label">Amount Payable Now</div>
          <div className="amount-val">₹{amount?.toLocaleString('en-IN')}</div>
          <div className="amount-for">{bookingTitle}</div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="scanner-mode-tabs">
          <button
            className={`scanner-tab-btn ${activeMode === 'qr' ? 'active' : ''}`}
            onClick={() => { setActiveMode('qr'); setCameraActive(false); }}
          >
            <QrCode size={15} /> Scan Studio QR Code
          </button>
          <button
            className={`scanner-tab-btn ${activeMode === 'camera' ? 'active' : ''}`}
            onClick={handleStartCamera}
          >
            <Camera size={15} /> Simulator Camera
          </button>
        </div>

        {/* Content based on state */}
        {paymentStatus === 'processing' ? (
          <div className="scanner-processing-state animate-fade">
            <div className="scanner-spinner-wrap">
              <div className="spinner-glow" />
              <RotateCw size={44} className="spin text-gold" />
            </div>
            <h4>Verifying UPI Payment...</h4>
            <p>Connecting to bank gateway and verifying transaction of ₹{amount}...</p>
            <div className="processing-steps">
              <span className="step-dot active" />
              <span className="step-dot active" />
              <span className="step-dot active" />
            </div>
          </div>
        ) : paymentStatus === 'success' ? (
          <div className="scanner-success-state animate-fade">
            <div className="success-check-bubble">
              <CheckCircle2 size={56} className="text-green" />
            </div>
            <h4>Payment Successful!</h4>
            <p className="success-amount">₹{amount} Paid</p>
            <p className="success-sub">Advance locked. Booking confirmed instantly!</p>
          </div>
        ) : activeMode === 'camera' ? (
          /* CAMERA SCANNER SIMULATOR */
          <div className="scanner-camera-view animate-fade">
            <div className="camera-viewport">
              <div className="camera-grid" />
              {/* Animated Laser Bar */}
              <div className="laser-scanner-line" />
              {/* Corner targeting brackets */}
              <div className="bracket bracket-tl" />
              <div className="bracket bracket-tr" />
              <div className="bracket bracket-bl" />
              <div className="bracket bracket-br" />

              <div className="camera-scan-hint">
                {cameraDetected ? (
                  <span className="detected-pill">
                    <Check size={14} /> UPI QR Code Detected! Authorizing...
                  </span>
                ) : (
                  <span>Align UPI QR code within frame</span>
                )}
              </div>
            </div>
            <p className="camera-instruction">
              Point camera at any UPI QR code. Auto-detection will process payment.
            </p>
          </div>
        ) : (
          /* QR CODE DISPLAY */
          <div className="scanner-qr-content animate-fade">
            <div className="qr-frame-wrapper">
              <div className="qr-frame">
                {/* Targeting Brackets */}
                <div className="qr-corner corner-tl" />
                <div className="qr-corner corner-tr" />
                <div className="qr-corner corner-bl" />
                <div className="qr-corner corner-br" />

                {/* Laser Bar */}
                <div className="qr-laser" />

                {/* SVG QR CODE */}
                <svg
                  viewBox="0 0 200 200"
                  className="qr-svg-image"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Background */}
                  <rect width="200" height="200" fill="#ffffff" rx="10" />

                  {/* Top-Left Finder */}
                  <rect x="20" y="20" width="45" height="45" fill="#111" rx="4" />
                  <rect x="27" y="27" width="31" height="31" fill="#fff" rx="2" />
                  <rect x="33" y="33" width="19" height="19" fill="#D4AF37" rx="2" />

                  {/* Top-Right Finder */}
                  <rect x="135" y="20" width="45" height="45" fill="#111" rx="4" />
                  <rect x="142" y="27" width="31" height="31" fill="#fff" rx="2" />
                  <rect x="148" y="33" width="19" height="19" fill="#D4AF37" rx="2" />

                  {/* Bottom-Left Finder */}
                  <rect x="20" y="135" width="45" height="45" fill="#111" rx="4" />
                  <rect x="27" y="142" width="31" height="31" fill="#fff" rx="2" />
                  <rect x="33" y="148" width="19" height="19" fill="#D4AF37" rx="2" />

                  {/* Realistic QR Matrix Data Pixels */}
                  <rect x="75" y="25" width="10" height="10" fill="#111" />
                  <rect x="95" y="25" width="10" height="10" fill="#111" />
                  <rect x="110" y="25" width="10" height="10" fill="#111" />

                  <rect x="75" y="45" width="10" height="10" fill="#111" />
                  <rect x="90" y="45" width="10" height="10" fill="#111" />
                  <rect x="105" y="45" width="10" height="10" fill="#111" />

                  <rect x="25" y="75" width="10" height="10" fill="#111" />
                  <rect x="40" y="75" width="10" height="10" fill="#111" />
                  <rect x="55" y="75" width="10" height="10" fill="#111" />
                  <rect x="70" y="75" width="10" height="10" fill="#111" />
                  <rect x="85" y="75" width="10" height="10" fill="#111" />
                  <rect x="100" y="75" width="10" height="10" fill="#111" />
                  <rect x="115" y="75" width="10" height="10" fill="#111" />
                  <rect x="130" y="75" width="10" height="10" fill="#111" />
                  <rect x="145" y="75" width="10" height="10" fill="#111" />
                  <rect x="160" y="75" width="10" height="10" fill="#111" />

                  <rect x="25" y="95" width="10" height="10" fill="#111" />
                  <rect x="45" y="95" width="10" height="10" fill="#111" />
                  <rect x="65" y="95" width="10" height="10" fill="#111" />
                  <rect x="80" y="95" width="10" height="10" fill="#111" />
                  <rect x="95" y="95" width="10" height="10" fill="#111" />
                  <rect x="115" y="95" width="10" height="10" fill="#111" />
                  <rect x="135" y="95" width="10" height="10" fill="#111" />
                  <rect x="155" y="95" width="10" height="10" fill="#111" />

                  <rect x="25" y="115" width="10" height="10" fill="#111" />
                  <rect x="40" y="115" width="10" height="10" fill="#111" />
                  <rect x="55" y="115" width="10" height="10" fill="#111" />
                  <rect x="75" y="115" width="10" height="10" fill="#111" />
                  <rect x="90" y="115" width="10" height="10" fill="#111" />
                  <rect x="110" y="115" width="10" height="10" fill="#111" />
                  <rect x="125" y="115" width="10" height="10" fill="#111" />
                  <rect x="140" y="115" width="10" height="10" fill="#111" />
                  <rect x="160" y="115" width="10" height="10" fill="#111" />

                  <rect x="75" y="135" width="10" height="10" fill="#111" />
                  <rect x="95" y="135" width="10" height="10" fill="#111" />
                  <rect x="115" y="135" width="10" height="10" fill="#111" />
                  <rect x="135" y="135" width="10" height="10" fill="#111" />
                  <rect x="150" y="135" width="10" height="10" fill="#111" />
                  <rect x="165" y="135" width="10" height="10" fill="#111" />

                  <rect x="75" y="155" width="10" height="10" fill="#111" />
                  <rect x="90" y="155" width="10" height="10" fill="#111" />
                  <rect x="105" y="155" width="10" height="10" fill="#111" />
                  <rect x="120" y="155" width="10" height="10" fill="#111" />
                  <rect x="140" y="155" width="10" height="10" fill="#111" />
                  <rect x="160" y="155" width="10" height="10" fill="#111" />

                  {/* Center MLP Logo Badge */}
                  <circle cx="100" cy="100" r="18" fill="#111" stroke="#D4AF37" strokeWidth="2" />
                  <text
                    x="100"
                    y="104"
                    fill="#D4AF37"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="serif"
                  >
                    MLP
                  </text>
                </svg>
              </div>
            </div>

            {/* UPI ID Row */}
            <div className="scanner-upi-id-box">
              <div className="upi-id-label">
                <span>UPI ID:</span>
                <strong>{upiId}</strong>
              </div>
              <button onClick={handleCopyUpi} className="upi-copy-btn" title="Copy UPI ID">
                {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Supported UPI Apps */}
            <div className="scanner-supported-apps">
              <span className="app-badge gpay">GPay</span>
              <span className="app-badge phonepe">PhonePe</span>
              <span className="app-badge paytm">Paytm</span>
              <span className="app-badge bhim">BHIM UPI</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {paymentStatus !== 'processing' && paymentStatus !== 'success' && (
          <div className="scanner-footer-actions">
            <button
              onClick={handleSimulatePayment}
              className="btn btn-gold btn-block btn-simulate-pay"
            >
              <Zap size={16} /> Simulate Successful Payment (₹{amount})
            </button>
            <p className="scanner-security-note">
              <ShieldCheck size={13} /> 256-Bit Encrypted Dummy Payment Simulator for Testing
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentScannerModal;
