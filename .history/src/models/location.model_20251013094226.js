// models/location.model.js
const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  countryCode: String,
  stateCode: String,
  districtName: String,
  cityName: String,
});

module.exports = mongoose.model('Location', LocationSchema);
