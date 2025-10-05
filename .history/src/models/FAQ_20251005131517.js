const mongoose = require('mongoose');
const FAQSchema = new mongoose.Schema({
question: String,
answer: String,
order: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('FAQ', FAQSchema);