const mongoose = require('mongoose');
const NewsSchema = new mongoose.Schema({
title: String,
about: String,
image: String,
date: Date,D
category: { type: String, enum: ['CRIME','donation','general'], default: 'general' }
}, { timestamps: true });
module.exports = mongoose.model('News', NewsSchema);