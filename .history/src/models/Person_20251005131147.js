const mongoose = require('mongoose');
const PersonSchema = new mongoose.Schema({
name: { type: String, required: true },
role: { type: String }, // e.g. 'Founder' or 'Member'
image: String,
about: String,
order: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Person', PersonSchema);