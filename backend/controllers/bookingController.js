const Booking = require('../models/Booking');
const packages = require('../../data/packages.json');
const services = require('../../data/services.json');
const bookingRules = require('../../data/booking_rules.json');

const BUSINESS_OPEN = 10;  // 10 AM
const BUSINESS_CLOSE = 19; // 7 PM
const BUFFER_HOURS = 2;
const MAX_ADVANCE_DAYS = 7;

const parseTimeToHours = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
};

const isOwnerAdmin = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const allowed = ['gokulsurya021@gmail.com', 'admin@mlpkids.com', (process.env.ADMIN_EMAIL || '').toLowerCase()].filter(Boolean);
  return allowed.includes(user.email?.toLowerCase());
};

const isWithinBusinessHours = (timeStr) => {
  const h = parseTimeToHours(timeStr);
  return h >= BUSINESS_OPEN && h < BUSINESS_CLOSE;
};

const checkBuffer = async (photographerId, date, time, excludeBookingId = null) => {
  if (photographerId === 'any') return true;
  const bookingTime = parseTimeToHours(time);
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  const query = {
    photographerId,
    date: { $gte: dateStart, $lte: dateEnd },
    status: { $nin: ['Cancelled'] }
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const existingBookings = await Booking.find(query);
  for (const b of existingBookings) {
    const existingTime = parseTimeToHours(b.time);
    if (Math.abs(bookingTime - existingTime) < BUFFER_HOURS) return false;
  }
  return true;
};

// @route POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const {
      customerName, email, phone, serviceId, packageId,
      photographerId, date, time, specialRequests
    } = req.body;

    // Validate required fields — serviceId optional (falls back to 'general')
    if (!customerName || !email || !phone || !packageId || !date || !time) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }

    // Find package info — packages are now global (diamond/gold/silver)
    const pkg = packages.find(p => p.id === packageId);
    // Service is optional — 'general' is valid for global packages
    const svc = serviceId === 'general'
      ? { name: 'MLP Kids Studio' }
      : services.find(s => s.id === serviceId);
    if (!pkg) {
      return res.status(400).json({ success: false, message: 'Invalid package selected' });
    }
    if (!svc) {
      return res.status(400).json({ success: false, message: 'Invalid service selected' });
    }

    // Validate business hours
    if (!isWithinBusinessHours(time)) {
      return res.status(400).json({ success: false, message: `Bookings only allowed between 10:00 AM and 7:00 PM` });
    }

    // Validate advance booking (max 7 days)
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
    if (bookingDate < today) {
      return res.status(400).json({ success: false, message: 'Cannot book for a past date' });
    }
    if (bookingDate > maxDate) {
      return res.status(400).json({ success: false, message: `Bookings can only be made up to ${MAX_ADVANCE_DAYS} days in advance` });
    }

    // Validate buffer for specific photographer
    if (photographerId && photographerId !== 'any') {
      const bufferOk = await checkBuffer(photographerId, date, time);
      if (!bufferOk) {
        return res.status(400).json({
          success: false,
          message: `This photographer has another shoot within 2 hours of your selected time. Please choose a different time.`
        });
      }
    }

    const booking = await Booking.create({
      user: req.user._id,
      customerName,
      email,
      phone,
      service: svc.name,
      serviceId,
      package: pkg.name,
      packageId,
      packagePrice: pkg.price,
      photographer: photographerId === 'any' ? 'Any Photographer' : photographerId,
      photographerId: photographerId || 'any',
      date: bookingDate,
      time,
      specialRequests: specialRequests || '',
      status: 'Pending',
      advancePaid: Boolean(req.body.advancePaid),
      paymentDetails: req.body.paymentDetails || undefined
    });

    res.status(201).json({ success: true, message: 'Booking created successfully', booking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating booking' });
  }
};

// @route PUT /api/bookings/:id/pay-advance
const payAdvanceBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString() && !isOwnerAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    booking.advancePaid = true;
    booking.paymentDetails = {
      gateway: 'Razorpay',
      paymentId: req.body.paymentId || 'pay_' + Math.random().toString(36).substring(2, 12),
      orderId: req.body.orderId || 'order_mlp_' + Math.random().toString(36).substring(2, 10),
      method: req.body.method || 'UPI_QR',
      utr: req.body.utr || '',
      amount: req.body.amount || bookingRules.advance_payment || 3000,
      paidAt: new Date()
    };
    await booking.save();
    res.json({
      success: true,
      message: `Advance payment of ₹${booking.paymentDetails.amount} confirmed via Razorpay!`,
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error confirming payment' });
  }
};

// @route GET /api/bookings/:id/payment-status
const getPaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({
      success: true,
      advancePaid: Boolean(booking.advancePaid),
      paymentDetails: booking.paymentDetails || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error checking payment status' });
  }
};

// @route GET /api/bookings/my
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user._id.toString() !== req.user._id.toString() && !isOwnerAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }
    if (booking.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed booking' });
    }
    booking.status = 'Cancelled';
    booking.cancellationReason = req.body.reason || 'Customer requested cancellation';
    await booking.save();
    res.json({
      success: true,
      message: `Booking cancelled. Cancellation fee: ₹${bookingRules.cancellation_fee}. Refund: ₹${bookingRules.refund_after_cancellation}`,
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route PUT /api/bookings/:id/reschedule
const rescheduleBooking = async (req, res) => {
  try {
    const { date, time } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (['Cancelled', 'Completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule this booking' });
    }
    if (!isWithinBusinessHours(time)) {
      return res.status(400).json({ success: false, message: 'New time must be within business hours (10 AM - 7 PM)' });
    }
    const newDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
    if (newDate < today || newDate > maxDate) {
      return res.status(400).json({ success: false, message: 'Invalid date for rescheduling' });
    }
    if (booking.photographerId !== 'any') {
      const bufferOk = await checkBuffer(booking.photographerId, date, time, booking._id);
      if (!bufferOk) {
        return res.status(400).json({ success: false, message: 'Photographer has another shoot within 2 hours of the new time' });
      }
    }
    booking.rescheduledFrom = booking.date;
    booking.date = newDate;
    booking.time = time;
    booking.status = 'Pending';
    await booking.save();
    res.json({ success: true, message: 'Booking rescheduled successfully', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

// @route GET /api/bookings/admin/all
const getAllBookingsAdmin = async (req, res) => {
  try {
    const { status, search, photographerId } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (photographerId && photographerId !== 'all') {
      query.photographerId = photographerId;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: regex },
        { email: regex },
        { phone: regex },
        { service: regex },
        { package: regex }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('getAllBookingsAdmin error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching bookings' });
  }
};

// @route GET /api/bookings/admin/stats
const getBookingStatsAdmin = async (req, res) => {
  try {
    const [all, pending, confirmed, completed, cancelled, advancePaid] = await Promise.all([
      Booking.find({}),
      Booking.countDocuments({ status: 'Pending' }),
      Booking.countDocuments({ status: 'Confirmed' }),
      Booking.countDocuments({ status: 'Completed' }),
      Booking.countDocuments({ status: 'Cancelled' }),
      Booking.countDocuments({ advancePaid: true })
    ]);

    const totalValue = all
      .filter(b => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + (b.packagePrice || 0), 0);

    const advanceCollected = advancePaid * (bookingRules.advance_payment || 3000);

    res.json({
      success: true,
      stats: {
        total: all.length,
        pending,
        confirmed,
        completed,
        cancelled,
        advancePaid,
        totalValue,
        advanceCollected
      }
    });
  } catch (error) {
    console.error('getBookingStatsAdmin error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};

// @route PUT /api/bookings/admin/:id/status
const updateBookingStatusAdmin = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    const booking = await Booking.findById(req.params.id).populate('user', 'name email phone');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = status;
    if (status === 'Cancelled' && cancellationReason) {
      booking.cancellationReason = cancellationReason;
    }
    if (status === 'Confirmed' && !booking.advancePaid) {
      // If confirmed, optionally mark advance paid if requested
      if (req.body.markAdvancePaid) {
        booking.advancePaid = true;
      }
    }

    await booking.save();

    res.json({
      success: true,
      message: `Booking #${booking._id.toString().slice(-6)} marked as ${status}`,
      booking
    });
  } catch (error) {
    console.error('updateBookingStatusAdmin error:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

// @route PUT /api/bookings/admin/:id/advance
const toggleAdvancePaidAdmin = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.advancePaid = typeof req.body.advancePaid === 'boolean'
      ? req.body.advancePaid
      : !booking.advancePaid;

    await booking.save();

    res.json({
      success: true,
      message: `Advance payment status set to ${booking.advancePaid ? 'Paid' : 'Unpaid'}`,
      booking
    });
  } catch (error) {
    console.error('toggleAdvancePaidAdmin error:', error);
    res.status(500).json({ success: false, message: 'Server error updating advance payment' });
  }
};

// @route PUT /api/bookings/admin/:id/assign
const assignPhotographerAdmin = async (req, res) => {
  try {
    const { photographerId, photographerName } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.photographerId = photographerId || 'any';
    booking.photographer = photographerName || photographerId || 'Any Photographer';

    await booking.save();

    res.json({
      success: true,
      message: `Photographer assigned: ${booking.photographer}`,
      booking
    });
  } catch (error) {
    console.error('assignPhotographerAdmin error:', error);
    res.status(500).json({ success: false, message: 'Server error assigning photographer' });
  }
};

module.exports = {
  createBooking,
  payAdvanceBooking,
  getPaymentStatus,
  getMyBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  getAllBookingsAdmin,
  getBookingStatsAdmin,
  updateBookingStatusAdmin,
  toggleAdvancePaidAdmin,
  assignPhotographerAdmin
};

