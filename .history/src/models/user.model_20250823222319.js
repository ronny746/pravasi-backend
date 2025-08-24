// src/models/user.model.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nameEn: { type: String},
  nameHi: { type: String },
  password: { type: String },
  email: { type: String },
  username: { type: String },
  phone: { type: String, unique: true },
  otp: { type: String },
  isVerified: { type: Boolean, default: false },
  bloodGroupEn: { type: String },
  bloodGroupHi: { type: String },
  occupationTypeEn: { type: String },
  occupationTypeHi: { type: String },
  occupationCompanyEn: { type: String },
  occupationCompanyHi: { type: String },
  occupationDesignationEn: { type: String },
  occupationDesignationHi: { type: String },
  addressCurrentEn: { type: String },
  addressCurrentHi: { type: String },
  addressPermanentEn: { type: String },
  addressPermanentHi: { type: String },
  photoUrl: { type: String },
  isPaid: { type: Boolean, default: false },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  deviceToken: {
    type: String,
    default: null // For push notifications
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
