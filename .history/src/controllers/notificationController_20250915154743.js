

const path = require('path'); // ← ye add karo file ke top me
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../config/firebase-service-account.json');

const PROJECT_ID = 'pravasi-fc099'; // 🔁 Replace with your actual Firebase project ID

async function getAccessToken() {
    const auth = new GoogleAuth({
        keyFile: SERVICE_ACCOUNT_PATH,
        scopes: 'https://www.googleapis.com/auth/firebase.messaging',
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token;
}

exports.sendPushNotification = async (req, res) => {
    const { message } = req.body;

    if (!message || !message.token) {
        return res.status(400).json({ error: 'message.token is required' });
    }

    try {
        const accessToken = await getAccessToken();

        const response = await axios.post(
            `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
            { message },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.status(200).json({ success: true, fcmResponse: response.data });
    } catch (error) {
        console.error('FCM error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to send FCM message' });
    }
}; const express = require("express");
const { sendPushNotification } = require("../controllers/notificationController");


const router = express.Router();


router.post("/push", sendPushNotification);

module.exports = router; 