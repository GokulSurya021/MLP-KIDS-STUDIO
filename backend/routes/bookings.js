const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createBooking,
  payAdvanceBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  getAllBookingsAdmin,
  getBookingStatsAdmin,
  updateBookingStatusAdmin,
  toggleAdvancePaidAdmin,
  assignPhotographerAdmin
} = require('../controllers/bookingController');

// Customer routes
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);

// Admin routes (must precede /:id)
router.get('/admin/all', protect, adminOnly, getAllBookingsAdmin);
router.get('/admin/stats', protect, adminOnly, getBookingStatsAdmin);
router.put('/admin/:id/status', protect, adminOnly, updateBookingStatusAdmin);
router.put('/admin/:id/advance', protect, adminOnly, toggleAdvancePaidAdmin);
router.put('/admin/:id/assign', protect, adminOnly, assignPhotographerAdmin);

// Individual booking routes
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/reschedule', protect, rescheduleBooking);
router.put('/:id/pay-advance', protect, payAdvanceBooking);

module.exports = router;

