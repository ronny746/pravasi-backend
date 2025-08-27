// src/routes/dashboard.routes.js

const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');




// Pravasi List Route with pagination and search
// GET /api/dashboard/pravasi?page=1&limit=10&search=rajveer&city=gurgaon
router.get('/pravasi', dashboardController.getPravasiBoysList);

// Single Pravasi Details Route


// Update Pravasi Status Route
// PUT /api/dashboard/pravasi/:id/status
router.put('/pravasi/:id/status', dashboardController.updatePravasiStatus);

module.exports = router;