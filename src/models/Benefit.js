const mongoose = require('mongoose');
const BenefitSchema = new mongoose.Schema({
title: String,
subtitle: String
}, { timestamps: true });
module.exports = mongoose.model('Benefit', BenefitSchema);