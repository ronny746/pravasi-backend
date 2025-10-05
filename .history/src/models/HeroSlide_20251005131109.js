const mongoose = require('mongoose');
const HeroSlideSchema = new mongoose.Schema({
title: String,
subtitle: String,
image: String, // URL or path
order: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('HeroSlide', HeroSlideSchema);