const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: { type: String, required: true, trim: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  serviceId: { type: String, required: true },
  package: { type: String, required: true },
  packageId: { type: String, required: true },
  packagePrice: { type: Number, required: true },
  photographer: {
    type: String,
    default: 'Any Photographer'
  },
  photographerId: {
    type: String,
    default: 'any'
  },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // "HH:MM"
  specialRequests: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  advancePaid: { type: Boolean, default: false },
  cancellationReason: { type: String, default: '' },
  rescheduledFrom: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

bookingSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Booking', bookingSchema);
