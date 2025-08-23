// src/models/user.model.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { en: String, hi: String },
    email: String,
    password: String,
    phone: String,
    otp: String,
    isVerified: { type: Boolean, default: false },
    bloodGroup: { en: String, hi: String },
    addresses: {
        current: { en: String, hi: String },
        permanent: { en: String, hi: String }
    },
    
    ,
    photoUrl: String,
    isPaid: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
