import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  IndianRupee,
  Camera,
  ExternalLink,
  ChevronDown,
  Lock,
  Sparkles,
  TrendingUp,
  FileCheck2,
  Filter
} from 'lucide-react';
import './AdminDashboard.css';

const PHOTOGRAPHERS = [
  { id: 'lokesh', name: 'Lokesh (Samalkot)' },
];

const AdminDashboard = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  // Only Gokul Surya is authorized to access the admin block
  const OWNER_EMAIL = 'gokulsurya021@gmail.com';
  const isAdmin = user && user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, Pending, Confirmed, Completed, Cancelled
  const [search, setSearch] = useState('');
  const [photographerFilter, setPhotographerFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Admin login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Cancellation modal
  const [cancelModal, setCancelModal] = useState({ open: false, bookingId: null, reason: '' });

  const fetchData = async (showRefreshToast = false) => {
    if (!isAdmin) return;
    try {
      if (showRefreshToast) setRefreshing(true);
      const [bookingsRes, statsRes] = await Promise.all([
        api.get('/bookings/admin/all'),
        api.get('/bookings/admin/stats')
      ]);

      if (bookingsRes.data?.success) {
        setBookings(bookingsRes.data.bookings || []);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }
      if (showRefreshToast) toast.success('Orders refreshed');
    } catch (err) {
      console.error('Fetch admin data error:', err);
      toast.error(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // Handle Quick / Form Admin Login
  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Welcome to Admin Portal');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 1. Confirm Order Action
  const handleConfirmOrder = async (bookingId, currentAdvancePaid) => {
    setActionLoadingId(bookingId);
    try {
      const res = await api.put(`/bookings/admin/${bookingId}/status`, {
        status: 'Confirmed',
        markAdvancePaid: true // By default, confirming also acknowledges/verifies advance
      });
      if (res.data?.success) {
        toast.success(`Shoot confirmed! Booking #${bookingId.slice(-6)}`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm order');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Mark Order as Completed
  const handleCompleteOrder = async (bookingId) => {
    setActionLoadingId(bookingId);
    try {
      const res = await api.put(`/bookings/admin/${bookingId}/status`, {
        status: 'Completed'
      });
      if (res.data?.success) {
        toast.success(`Shoot marked as Completed!`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Toggle Advance Payment
  const handleToggleAdvance = async (bookingId, currentVal) => {
    setActionLoadingId(bookingId);
    try {
      const res = await api.put(`/bookings/admin/${bookingId}/advance`, {
        advancePaid: !currentVal
      });
      if (res.data?.success) {
        toast.success(!currentVal ? 'Advance marked as Paid ✓' : 'Advance marked as Unpaid');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update advance payment');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Assign Photographer
  const handleAssignPhotographer = async (bookingId, photographerId) => {
    const photoObj = PHOTOGRAPHERS.find(p => p.id === photographerId);
    const photographerName = photoObj ? photoObj.name.split(' (')[0] : photographerId;
    setActionLoadingId(bookingId);
    try {
      const res = await api.put(`/bookings/admin/${bookingId}/assign`, {
        photographerId,
        photographerName
      });
      if (res.data?.success) {
        toast.success(`Assigned ${photographerName}`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign photographer');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Open Cancel Modal
  const openCancelModal = (bookingId) => {
    setCancelModal({ open: true, bookingId, reason: '' });
  };

  // 6. Submit Cancel
  const handleConfirmCancel = async () => {
    if (!cancelModal.bookingId) return;
    setActionLoadingId(cancelModal.bookingId);
    try {
      const res = await api.put(`/bookings/admin/${cancelModal.bookingId}/status`, {
        status: 'Cancelled',
        cancellationReason: cancelModal.reason || 'Admin cancelled'
      });
      if (res.data?.success) {
        toast.success('Order cancelled');
        setCancelModal({ open: false, bookingId: null, reason: '' });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Tab filter
      if (activeTab !== 'all' && b.status !== activeTab) return false;

      // Photographer filter
      if (photographerFilter !== 'all' && b.photographerId !== photographerFilter) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = b.customerName?.toLowerCase().includes(q);
        const matchPhone = b.phone?.includes(q);
        const matchEmail = b.email?.toLowerCase().includes(q);
        const matchService = b.service?.toLowerCase().includes(q);
        const matchPkg = b.package?.toLowerCase().includes(q);
        const matchId = b._id?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchService && !matchPkg && !matchId) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, activeTab, photographerFilter, search]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: bookings.length,
      Pending: bookings.filter(b => b.status === 'Pending').length,
      Confirmed: bookings.filter(b => b.status === 'Confirmed').length,
      Completed: bookings.filter(b => b.status === 'Completed').length,
      Cancelled: bookings.filter(b => b.status === 'Cancelled').length,
    };
  }, [bookings]);

  // ==========================================
  // RENDER: NOT ADMIN / LOGIN SCREEN
  // ==========================================
  if (user && !isAdmin) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-shield-icon" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}>
              <ShieldCheck size={36} />
            </div>
            <h2>Access Restricted</h2>
            <p className="admin-login-subtitle">
              Private Studio Owner Access Only
            </p>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            padding: '20px',
            margin: '22px 0',
            textAlign: 'center',
            fontSize: '0.92rem',
            color: '#cbd5e1',
            lineHeight: 1.6
          }}>
            <p style={{ marginBottom: '10px' }}>
              This Admin Control Center is strictly restricted to studio owner (<strong className="text-gold">{OWNER_EMAIL}</strong>).
            </p>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              You are currently signed in as: <strong style={{ color: '#fff' }}>{user.email}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => logout()}
              className="btn btn-outline btn-block"
              style={{ padding: '12px' }}
            >
              Sign Out / Switch Account
            </button>
            <Link to="/" className="btn btn-gold btn-block" style={{ padding: '12px', textAlign: 'center' }}>
              Back to Customer Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-shield-icon">
              <ShieldCheck size={36} />
            </div>
            <h2>MLP Admin Portal</h2>
            <p className="admin-login-subtitle">
              Studio Owner Authentication
            </p>
          </div>

          <div style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '10px',
            padding: '10px',
            marginTop: '12px',
            marginBottom: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 600, textTransform: 'uppercase' }}>
              ⚡ Quick Fill Admin Credentials:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('gokulsurya021@gmail.com');
                  setLoginPassword('admin123');
                }}
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  color: '#fef08a',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.74rem',
                  fontWeight: 600
                }}
              >
                Gokul Surya
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('admin@mlpkids.com');
                  setLoginPassword('admin123');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#e2e8f0',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.74rem',
                  fontWeight: 600
                }}
              >
                Studio Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="admin-form" style={{ marginTop: '15px' }} autoComplete="off">
            <div className="admin-input-group">
              <label>Owner Email</label>
              <div className="admin-input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="youremail@example.com"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="admin-input-group">
              <label>Password</label>
              <div className="admin-input-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn btn-gold btn-block"
              style={{ marginTop: '16px' }}
            >
              {isLoggingIn ? 'Verifying Credentials...' : 'Sign In as Owner'}
            </button>
          </form>

          <div className="admin-back-to-site">
            <Link to="/" className="admin-site-link">
              <ArrowLeft size={16} /> Back to Customer Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="admin-page">
      {/* Top Banner / Two-Way Link Bar */}
      <header className="admin-header">
        <div className="container admin-header-inner">
          <div className="admin-brand">
            <div className="admin-logo-icon">
              <Camera size={20} />
            </div>
            <div>
              <div className="admin-title-row">
                <span className="admin-logo-text">MLP Kids Studio</span>
                <span className="admin-badge">
                  <ShieldCheck size={13} /> ADMIN BLOCK
                </span>
                <span style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24',
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🔥 Firestore Connected
                </span>
              </div>
              <p className="admin-subtext">Order Confirmation & Studio Operations</p>
            </div>
          </div>

          <div className="admin-nav-actions">
            {/* LINK TO CUSTOMER SITE */}
            <Link to="/" className="btn btn-outline admin-nav-btn">
              <ArrowLeft size={16} />
              <span>Customer Website</span>
            </Link>

            <Link to="/book" className="btn btn-ghost admin-nav-btn">
              <ExternalLink size={15} />
              <span>New Customer Shoot</span>
            </Link>

            <button
              onClick={() => fetchData(true)}
              className="btn btn-ghost admin-refresh-btn"
              title="Refresh Orders"
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            </button>

            <div className="admin-user-pill">
              <span className="admin-user-dot" />
              <span className="admin-user-email">{user?.name || user?.email}</span>
            </div>

            <button onClick={logout} className="admin-logout-btn" title="Logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container admin-main">
        {/* Pending Orders Notice Alert if pending > 0 */}
        {tabCounts.Pending > 0 && (
          <div className="admin-pending-alert animate-fade">
            <div className="pending-alert-icon">
              <AlertCircle size={22} />
            </div>
            <div className="pending-alert-content">
              <h4>
                {tabCounts.Pending} Customer {tabCounts.Pending === 1 ? 'Order Requires' : 'Orders Require'} Confirmation
              </h4>
              <p>
                Customers are waiting for their photoshoot schedule confirmation. Click <strong>"Confirm Order"</strong> below to confirm their slot.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('Pending')}
              className="btn btn-gold btn-sm"
            >
              View Pending Orders ({tabCounts.Pending})
            </button>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="admin-stats-grid">
          <div
            className={`admin-stat-card stat-pending ${activeTab === 'Pending' ? 'active-stat' : ''}`}
            onClick={() => setActiveTab('Pending')}
          >
            <div className="stat-card-top">
              <span className="stat-label">Pending Orders</span>
              <div className="stat-icon-wrap icon-amber">
                <Clock size={20} />
              </div>
            </div>
            <div className="stat-value text-amber">{stats?.pending ?? 0}</div>
            <div className="stat-footer">
              <span className="stat-pill pill-amber">Awaiting confirmation</span>
            </div>
          </div>

          <div
            className={`admin-stat-card stat-confirmed ${activeTab === 'Confirmed' ? 'active-stat' : ''}`}
            onClick={() => setActiveTab('Confirmed')}
          >
            <div className="stat-card-top">
              <span className="stat-label">Confirmed Shoots</span>
              <div className="stat-icon-wrap icon-green">
                <CheckCircle size={20} />
              </div>
            </div>
            <div className="stat-value text-green">{stats?.confirmed ?? 0}</div>
            <div className="stat-footer">
              <span className="stat-pill pill-green">Scheduled & Approved</span>
            </div>
          </div>

          <div
            className={`admin-stat-card stat-completed ${activeTab === 'Completed' ? 'active-stat' : ''}`}
            onClick={() => setActiveTab('Completed')}
          >
            <div className="stat-card-top">
              <span className="stat-label">Completed</span>
              <div className="stat-icon-wrap icon-blue">
                <FileCheck2 size={20} />
              </div>
            </div>
            <div className="stat-value text-blue">{stats?.completed ?? 0}</div>
            <div className="stat-footer">
              <span className="stat-pill pill-blue">Shoots Delivered</span>
            </div>
          </div>

          <div className="admin-stat-card stat-revenue">
            <div className="stat-card-top">
              <span className="stat-label">Total Booking Value</span>
              <div className="stat-icon-wrap icon-gold">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="stat-value text-gold">
              ₹{(stats?.totalValue ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="stat-footer">
              <span className="stat-subtext">
                Advance Paid: <strong>{stats?.advancePaid ?? 0} orders</strong> (₹{(stats?.advanceCollected ?? 0).toLocaleString('en-IN')})
              </span>
            </div>
          </div>
        </div>

        {/* CONTROLS BAR: TABS + SEARCH + FILTER */}
        <div className="admin-controls-card">
          <div className="admin-tabs">
            {[
              { key: 'all', label: 'All Orders', count: tabCounts.all },
              { key: 'Pending', label: 'Pending', count: tabCounts.Pending, highlight: tabCounts.Pending > 0 },
              { key: 'Confirmed', label: 'Confirmed', count: tabCounts.Confirmed },
              { key: 'Completed', label: 'Completed', count: tabCounts.Completed },
              { key: 'Cancelled', label: 'Cancelled', count: tabCounts.Cancelled },
            ].map(tab => (
              <button
                key={tab.key}
                className={`admin-tab-btn ${activeTab === tab.key ? 'active' : ''} ${tab.highlight ? 'tab-pulse' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.label}</span>
                <span className={`tab-count ${tab.key}`}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="admin-search-filter-row">
            <div className="admin-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer, phone, email, service..."
                className="admin-search-input"
              />
              {search && (
                <button onClick={() => setSearch('')} className="search-clear">
                  <XCircle size={14} />
                </button>
              )}
            </div>

            <div className="admin-filter-wrap">
              <Filter size={15} className="filter-icon" />
              <select
                value={photographerFilter}
                onChange={(e) => setPhotographerFilter(e.target.value)}
                className="admin-select"
              >
                <option value="all">All Photographers</option>
                {PHOTOGRAPHERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ORDERS LIST */}
        <div className="admin-orders-section">
          {loading ? (
            <div className="admin-loading">
              <div className="spinner" />
              <p>Loading customer orders...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="admin-empty-state">
              <div className="empty-icon-wrap">
                <CheckCircle size={40} className="text-gold" />
              </div>
              <h3>No Orders Found</h3>
              <p>
                {search || photographerFilter !== 'all' || activeTab !== 'all'
                  ? 'No bookings match your selected filter criteria.'
                  : 'No customer orders have been received yet.'}
              </p>
              {(search || photographerFilter !== 'all' || activeTab !== 'all') && (
                <button
                  onClick={() => { setActiveTab('all'); setSearch(''); setPhotographerFilter('all'); }}
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '12px' }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="admin-orders-grid">
              {filteredBookings.map((b) => {
                const isLoading = actionLoadingId === b._id;
                const formattedDate = new Date(b.date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={b._id}
                    className={`admin-order-card status-${b.status?.toLowerCase()} ${b.status === 'Pending' ? 'order-card-pending' : ''}`}
                  >
                    {/* Card Header */}
                    <div className="order-card-header">
                      <div className="order-id-group">
                        <span className="order-booking-id">#{b._id.slice(-6).toUpperCase()}</span>
                        <span className="order-date-booked">
                          Booked {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div className="order-status-group">
                        {/* Status Badge */}
                        <span className={`order-status-badge badge-${b.status?.toLowerCase()}`}>
                          {b.status === 'Pending' && <Clock size={12} />}
                          {b.status === 'Confirmed' && <CheckCircle size={12} />}
                          {b.status === 'Completed' && <FileCheck2 size={12} />}
                          {b.status === 'Cancelled' && <XCircle size={12} />}
                          {b.status}
                        </span>

                        {/* Advance Payment Badge */}
                        <button
                          onClick={() => handleToggleAdvance(b._id, b.advancePaid)}
                          disabled={isLoading}
                          className={`advance-badge ${b.advancePaid ? 'advance-paid' : 'advance-unpaid'}`}
                          title="Click to toggle advance payment status"
                        >
                          {b.advancePaid ? `₹${(b.paymentDetails?.amount || 3000).toLocaleString('en-IN')} Advance Paid ✓` : 'Advance Unpaid ✗'}
                        </button>
                      </div>
                    </div>

                    {/* Card Content Grid */}
                    <div className="order-card-body">
                      {/* Customer Info */}
                      <div className="order-info-block">
                        <div className="info-block-header">
                          <User size={14} className="text-gold" />
                          <span className="info-block-title">Customer</span>
                        </div>
                        <div className="customer-name-big">{b.customerName}</div>
                        <div className="customer-contacts">
                          <a href={`tel:${b.phone}`} className="customer-contact-link" title="Call Customer">
                            <Phone size={13} /> {b.phone}
                          </a>
                          <a href={`mailto:${b.email}`} className="customer-contact-link" title="Email Customer">
                            <Mail size={13} /> {b.email}
                          </a>
                        </div>
                      </div>

                      {/* Shoot Service & Package */}
                      <div className="order-info-block">
                        <div className="info-block-header">
                          <Camera size={14} className="text-gold" />
                          <span className="info-block-title">Service & Package</span>
                        </div>
                        <div className="service-name-text">{b.service}</div>
                        <div className="package-name-text">
                          {b.package} • <strong className="text-gold">₹{b.packagePrice?.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>

                      {/* Schedule: Date & Time */}
                      <div className="order-info-block">
                        <div className="info-block-header">
                          <Calendar size={14} className="text-gold" />
                          <span className="info-block-title">Date & Slot</span>
                        </div>
                        <div className="schedule-date-text">{formattedDate}</div>
                        <div className="schedule-time-badge">
                          <Clock size={12} /> {b.time}
                        </div>
                      </div>

                      {/* Photographer Assignment */}
                      <div className="order-info-block">
                        <div className="info-block-header">
                          <User size={14} className="text-gold" />
                          <span className="info-block-title">Assigned Photographer</span>
                        </div>
                        <select
                          value={b.photographerId || 'any'}
                          onChange={(e) => handleAssignPhotographer(b._id, e.target.value)}
                          disabled={isLoading}
                          className="photographer-select-input"
                        >
                          {PHOTOGRAPHERS.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Special Requests or Notes */}
                    {b.specialRequests && (
                      <div className="order-special-requests">
                        <span className="requests-label">Note:</span>
                        <span className="requests-text">"{b.specialRequests}"</span>
                      </div>
                    )}

                    {b.cancellationReason && b.status === 'Cancelled' && (
                      <div className="order-cancel-reason">
                        <span className="requests-label">Reason:</span>
                        <span className="requests-text">{b.cancellationReason}</span>
                      </div>
                    )}

                    {/* Admin Action Buttons */}
                    <div className="order-actions-bar">
                      {b.status === 'Pending' && (
                        <button
                          onClick={() => handleConfirmOrder(b._id, b.advancePaid)}
                          disabled={isLoading}
                          className="btn btn-confirm-order"
                        >
                          <CheckCircle size={16} />
                          <span>{isLoading ? 'Confirming...' : 'Confirm Order'}</span>
                        </button>
                      )}

                      {b.status === 'Confirmed' && (
                        <button
                          onClick={() => handleCompleteOrder(b._id)}
                          disabled={isLoading}
                          className="btn btn-complete-order"
                        >
                          <FileCheck2 size={16} />
                          <span>Mark Completed</span>
                        </button>
                      )}

                      {b.status !== 'Cancelled' && (
                        <button
                          onClick={() => openCancelModal(b._id)}
                          disabled={isLoading}
                          className="btn btn-cancel-order"
                        >
                          <XCircle size={14} />
                          <span>Cancel</span>
                        </button>
                      )}

                      {b.status === 'Cancelled' && (
                        <button
                          onClick={() => handleConfirmOrder(b._id, b.advancePaid)}
                          disabled={isLoading}
                          className="btn btn-outline btn-sm"
                        >
                          <RefreshCw size={13} />
                          <span>Re-open / Confirm</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Cancellation Reason Modal */}
      {cancelModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box animate-fade">
            <h3>Cancel Customer Booking</h3>
            <p className="modal-sub">
              Are you sure you want to cancel this booking? This will update the customer's portal.
            </p>
            <div className="modal-input-wrap">
              <label>Reason for Cancellation (Optional)</label>
              <textarea
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                placeholder="e.g., Slot unavailable, customer requested change, weather conditions..."
                rows={3}
                className="modal-textarea"
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setCancelModal({ open: false, bookingId: null, reason: '' })}
                className="btn btn-ghost"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="btn btn-danger"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
