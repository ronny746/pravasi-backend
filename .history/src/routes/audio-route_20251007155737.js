const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audio_controller');

// Route to generate audio link
router.post('/tts-link', audioController.generateAudio);

module.exports = router;
