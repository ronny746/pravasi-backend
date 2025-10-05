const mongoose = require('mongoose');
const MissionCardSchema = new mongoose.Schema({
title: String,
subtitle: String,
icon: String
}, { timestamps: true });
module.exports = mongoose.model('MissionCard', MissionCardSchema);