// src/models/user.model.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { 
        en: String, 
        hi: String,
        _id: false  // Disable _id for nested object
    },
    email: String,
    password: String,
    phone: String,
    otp: String,
    isVerified: { type: Boolean, default: false },
    bloodGroup: { 
        en: String, 
        hi: String,
        _id: false  // Disable _id for nested object
    },
    occupations: {
        type: {
            en: String,
            hi: String,
            _id: false  // Disable _id for nested object
        },
        companyName: {
            en: String,
            hi: String,
            _id: false  // Disable _id for nested object
        },
        designation: {
            en: String,
            hi: String,
            _id: false  // Disable _id for nested object
        },
        _id: false  // Disable _id for the occupation object itself
    },
    addresses: {
        current: { 
            en: String, 
            hi: String,
            _id: false  // Disable _id for nested object
        },
        permanent: { 
            en: String, 
            hi: String,
            _id: false  // Disable _id for nested object
        },
        _id: false  // Disable _id for the addresses object itself
    },
    photoUrl: String,
    isPaid: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);