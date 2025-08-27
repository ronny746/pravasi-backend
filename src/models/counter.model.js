const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "user_pr_seq"
  seq: { type: Number, default: 0 }
}, { versionKey: false });

module.exports = mongoose.model('Counter', counterSchema);
