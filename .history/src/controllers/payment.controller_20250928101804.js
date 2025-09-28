const axios = require('axios');
const User = require('../models/user.model');

const CASHFREE_BASE_URL = "https://prod.cashfree.com/pg/orders"; // change to prod in live
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

exports.createOrder = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    const orderId = "ORDER_" + Date.now();

    // Call Cashfree API
    const response = await axios.post(CASHFREE_BASE_URL, {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: userId,
        customer_phone: "9999999999", // replace dynamically from user
        customer_email: "test@test.com"
      }
    }, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2022-09-01",
        "Content-Type": "application/json"
      }
    });

    // Save initial order to user
    const user = await User.findById(userId);
    user.paymentInfo.orderId = orderId;
    user.paymentInfo.amount = amount;
    user.paymentInfo.status = 'pending';
    user.paymentInfo.paymentHistory.push({
      orderId,
      amount,
      status: 'pending'
    });
    await user.save();

    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Error creating order" });
  }
};

exports.webhookHandler = async (req, res) => {
  try {
    const { order_id, order_status, order_amount } = req.body.data;

    const user = await User.findOne({ "paymentInfo.orderId": order_id });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Update payment info
    user.paymentInfo.status = order_status.toLowerCase();
    if (order_status === "PAID") {
      user.isPaid = true;
      user.paymentInfo.purchasedAt = new Date();
      user.paymentInfo.expiryAt = null; // lifetime
    }

    // Update payment history last entry
    const lastPayment = user.paymentInfo.paymentHistory.find(p => p.orderId === order_id);
    if (lastPayment) lastPayment.status = order_status.toLowerCase();

    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("paymentInfo");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user.paymentInfo.paymentHistory });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
};
