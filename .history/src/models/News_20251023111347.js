const mongoose = require('mongoose');
const NewsSchema = new mongoose.Schema({
title: String,
about: String,
image: String,
date: Date,GENERAL
category: { type: String, enum: ['CRIME','DONATION','general'], default: 'general' }
}, { timestamps: true });
module.exports = mongoose.model('News', NewsSchema);