const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: false,
    trim: true
  },
  lastName: {
    type: String,
    required: false,
    trim: true
  },
  nationalCode: {
    type: String,
    required: false,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
  birthDate: {
    type: Date,
    required: false
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: false
  },
  // Spouse information
  spouseFirstName: {
    type: String,
    required: false,
    trim: true
  },
  spouseLastName: {
    type: String,
    required: false,
    trim: true
  },
  spouseNationalCode: {
    type: String,
    required: false,
    trim: true
  },
  spousePhoneNumber: {
    type: String,
    required: false,
    trim: true
  },
  password: {
    type: String,
    required: false,
    minlength: 6
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get full name
userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

module.exports = mongoose.model('User', userSchema);