import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SmartBook from './components/SmartBook';

import Home from './pages/Home';
import Services from './pages/Services';
import Packages from './pages/Packages';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Photographers from './pages/Photographers';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import PaymentPortal from './pages/PaymentPortal';
import BookShoot from './pages/BookShoot';
import MyBookings from './pages/MyBookings';
import RagChat from './pages/RagChat';

import AdminDashboard from './pages/AdminDashboard';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Reset window scroll position instantly to top on tab switch
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Trigger route progress bar
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {isNavigating && <div className="route-progress-bar" key={location.pathname + '_progress'} />}
      {!isAdminPath && <Navbar />}
      <div key={location.pathname} className="route-page-container">
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/photographers" element={<Photographers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/rag" element={<RagChat />} />
          <Route path="/doc-ai" element={<RagChat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/payment" element={<PaymentPortal />} />
          <Route path="/pay" element={<PaymentPortal />} />
          <Route path="/test-payment" element={<Navigate to="/payment" replace />} />
          <Route path="/pay-1" element={<Navigate to="/payment" replace />} />
          <Route path="/book" element={<ProtectedRoute><BookShoot /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      {!isAdminPath && <Footer />}
      {!isAdminPath && <SmartBook />}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#161616',
              color: '#F5F0E8',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#D4AF37', secondary: '#0a0a0a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            duration: 4000,
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
