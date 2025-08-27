// src/routes/dashboard.routes.js

const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');

// Dashboard Stats Route
// GET /api/dashboard/stats
router.get('/stats', dashboardController.getDashboardData);

// Pravasi List Route with pagination and search
// GET /api/dashboard/pravasi?page=1&limit=10&search=rajveer&city=gurgaon
router.get('/pravasi', dashboardController.getPravasiList);

// // Single Pravasi Details Route
// // GET /api/dashboard/pravasi/:id
// router.get('/pravasi/:id', dashboardController.getSinglePravasi);



module.exports = router;