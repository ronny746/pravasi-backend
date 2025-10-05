const mongoose = require('mongoose');
const GallerySchema = new mongoose.Schema({
title: String,
image: String
}, { timestamps: true });
module.exports = mongoose.model('GalleryItem', GallerySchema);