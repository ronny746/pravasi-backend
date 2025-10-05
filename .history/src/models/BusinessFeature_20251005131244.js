const mongoose = require('mongoose');
const BusinessFeatureSchema = new mongoose.Schema({
title: String,
subtitle: String,
image: String,
about: String,
place: String
}, { timestamps: true });
module.exports = mongoose.model('BusinessFeature', BusinessFeatureSchema);