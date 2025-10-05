const mongoose = require('mongoose');
const EventSchema = new mongoose.Schema({
title: String,
subtitle: String,
about: String,
place: String,
image: String,
date: Date
}, { timestamps: true });
module.exports = mongoose.model('Event', EventSchema);