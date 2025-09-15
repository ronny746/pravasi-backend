const express = require("express");
const { sendPushNotification } = require("../controllers/notificationController");


const router = express.Router();


router.post("/push", sendPushNotification);

module.exports = router; 