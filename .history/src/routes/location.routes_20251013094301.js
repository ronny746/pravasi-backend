// routes/location.routes.js
const express = require('express');
const router = express.Router();
const {
  getStates,
  getCitiesByState,
  getAllCities,
} = require('../controllers/location.controller');

router.get('/states', getStates);
router.get('/cities/:stateCode', getCitiesByState);
router.get('/cities', getAllCities);

module.exports = router;
