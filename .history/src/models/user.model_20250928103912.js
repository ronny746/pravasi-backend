// src/models/user.model.js
const mongoose = require('mongoose');

const PaymentHistorySchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  paymentId: { type: String },
  amount: { type: Number, required: true }, // in rupees
  status: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

const UserSchema = new mongoose.Schema({
  nameEn: { type: String },
  nameHi: { type: String },
  password: { type: String },
  email: { type: String },
  username: { type: String },
  phone: { type: String, unique: true },
  otp: { type: String },
  isVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  isAccountCompleted: { type: Boolean, default: false },
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
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  // 👉 new field for sequential user ID like PR00001
  publicId: { type: String, unique: true, sparse: true },
  paymentInfo: {
  orderId: { type: String }, // cashfree orderId
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  purchasedAt: { type: Date },
  expiryAt: { type: Date }, // for lifetime you can keep null
  paymentInfo: {
    orderId: String,          // last order
    paymentId: String,        // last payment id
    status: { type: String, default: 'none' },
    amount: Number,           // last amount (rupees)
    purchasedAt: Date,
    expiryAt: Date,
    paymentHistory: [PaymentHistorySchema]
  },
  isPaid: { type: Boolean, default: false }
}

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
