const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['مشاوره', 'آموزش', 'نظرسنجی', 'آزمون', 'سایر'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    type: String,
    enum: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
    required: true
  },
  duration: {
    type: Number, // در دقیقه
    default: 60
  },
  status: {
    type: String,
    enum: ['در انتظار', 'تایید شده', 'رد شده', 'لغو شده', 'تکمیل شده'],
    default: 'در انتظار'
  },
  adminNotes: {
    type: String
  },
  confirmedDate: {
    type: Date
  },
  confirmedTime: {
    type: String
  },
  contactMethod: {
    type: String,
    enum: ['تلفن', 'ویدیو', 'حضوری'],
    default: 'تلفن'
  },
  contactInfo: {
    phone: String,
    email: String,
    address: String
  },
  isUrgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better performance
appointmentSchema.index({ userId: 1, status: 1 });
appointmentSchema.index({ preferredDate: 1, status: 1 });
appointmentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
