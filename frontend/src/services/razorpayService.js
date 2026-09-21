/**
 * ── Official Razorpay Gateway Service ──────────────────────────────
 * Loads official checkout.js, creates backend order, launches Razorpay
 * native modal (UPI, Cards, Netbanking, QR), and verifies signature.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';';

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const launchRazorpayGateway = async ({
  amount = 3000,
  bookingId = null,
  bookingTitle = 'MLP Kids Studio Shoot Advance',
  customer = {},
  preferredMethod = null, // 'upi' | 'card' | null (all)
  onSuccess,
  onFailure,
  onDismiss
}) => {
  // 1. Ensure Razorpay SDK is loaded
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    const err = new Error('Could not connect to Razorpay payment gateway. Please check your internet.');
    if (onFailure) onFailure(err);
    throw err;
  }

  // 2. Create official order on backend
  const token = localStorage.getItem('mlp_token') || localStorage.getItem('token');
  const authHeaders = { 'Content-Type': 'application/json' };
  if (token && token !== 'null' && token !== 'undefined') {
    authHeaders.Authorization = `Bearer ${token}`;
  }

  const orderRes = await fetch(`${API_BASE}/payment/create-order`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ bookingId, amount })
  });
  const orderData = await orderRes.json();

  if (!orderData.success) {
    const err = new Error(orderData.message || 'Failed to initialize payment gateway order');
    if (onFailure) onFailure(err);
    throw err;
  }

  // 3. Configure official Razorpay Checkout options
  const options = {
    key: orderData.keyId,
    amount: orderData.amount, // in paise
    currency: orderData.currency || 'INR',
    name: 'MLP Kids Studio',
    description: bookingTitle,
    order_id: orderData.orderId,
    image: '/images/studio/shoot-01.jpg',
    prefill: {
      name: customer.name || orderData.booking?.customerName || '',
      email: customer.email || orderData.booking?.email || '',
      contact: customer.phone || orderData.booking?.phone || '',
      method: preferredMethod || undefined
    },
    theme: {
      color: '#d4af37' // Studio Gold Theme
    },
    retry: {
      enabled: true,
      max_count: 3
    },
    // Official Gateway Success Handler
    handler: async (response) => {
      try {
        const verifyRes = await fetch(`${API_BASE}/payment/verify`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId
          })
        });
        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          if (onSuccess) onSuccess(verifyData.payment);
        } else {
          throw new Error(verifyData.message || 'Payment signature verification failed');
        }
      } catch (err) {
        console.error('Razorpay verification error:', err);
        if (onFailure) onFailure(err);
      }
    },
    modal: {
      ondismiss: () => {
        if (onDismiss) onDismiss();
      }
    }
  };

  // 4. Launch official Razorpay payment window
  const rzp = new window.Razorpay(options);

  rzp.on('payment.failed', (failResponse) => {
    console.error('Razorpay payment failed:', failResponse.error);
    if (onFailure) onFailure(failResponse.error);
  });

  rzp.open();
};
