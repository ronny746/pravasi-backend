const axios = require('axios');
const User = require('../models/user.model');

const CASHFREE_BASE_URL = "https://prod.cashfree.com/pg/orders"; // change to prod in live
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

// Add timeout for axios requests
const axiosConfig = {
  timeout: 30000, // 30 seconds timeout
  headers: {
    "x-client-id": CASHFREE_APP_ID,
    "x-client-secret": CASHFREE_SECRET_KEY,
    "x-api-version": "2022-09-01",
    "Content-Type": "application/json"
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    // Input validation
    if (!userId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "UserId and amount are required" 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Amount must be greater than 0" 
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const orderId = "ORDER_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

    console.log(`Creating order: ${orderId} for user: ${userId}, amount: ${amount}`);

    // Call Cashfree API with proper error handling
    const cashfreePayload = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: userId,
        customer_phone: user.phone || "9999999999", // Use actual user phone
        customer_email: user.email || "test@test.com" // Use actual user email
      }
    };

    const response = await axios.post(CASHFREE_BASE_URL, cashfreePayload, axiosConfig);

    console.log('Cashfree response:', response.status, response.statusText);

    // Save initial order to user
    user.paymentInfo = user.paymentInfo || {};
    user.paymentInfo.orderId = orderId;
    user.paymentInfo.amount = amount;
    user.paymentInfo.status = 'pending';
    user.paymentInfo.paymentHistory = user.paymentInfo.paymentHistory || [];
    
    user.paymentInfo.paymentHistory.push({
      orderId,
      amount: parseFloat(amount),
      status: 'pending',
      createdAt: new Date()
    });
    
    await user.save();

    console.log(`Order created successfully: ${orderId}`);

    return res.status(200).json({ 
      success: true, 
      data: response.data,
      orderId: orderId
    });

  } catch (err) {
    console.error('Create Order Error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      stack: err.stack
    });

    // Handle different types of errors
    if (err.code === 'ECONNABORTED') {
      return res.status(408).json({ 
        success: false, 
        message: "Request timeout. Please try again." 
      });
    }

    if (err.response?.status === 401) {
      return res.status(500).json({ 
        success: false, 
        message: "Payment gateway authentication failed" 
      });
    }

    if (err.response?.status >= 400 && err.response?.status < 500) {
      return res.status(400).json({ 
        success: false, 
        message: err.response?.data?.message || "Invalid request data" 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: "Error creating order. Please try again." 
    });
  }
};

exports.webhookHandler = async (req, res) => {
  try {
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));

    // Validate webhook data
    if (!req.body || !req.body.data) {
      console.error('Invalid webhook payload');
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    const { order_id, order_status, order_amount } = req.body.data;

    if (!order_id || !order_status) {
      console.error('Missing required fields in webhook');
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    console.log(`Processing webhook for order: ${order_id}, status: ${order_status}`);

    const user = await User.findOne({ "paymentInfo.orderId": order_id });
    if (!user) {
      console.error(`User not found for order: ${order_id}`);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update payment info
    const previousStatus = user.paymentInfo.status;
    user.paymentInfo.status = order_status.toLowerCase();
    
    if (order_status === "PAID") {
      user.isPaid = true;
      user.paymentInfo.purchasedAt = new Date();
      user.paymentInfo.expiryAt = null; // lifetime
      console.log(`Payment successful for user: ${user._id}`);
    }

    // Update payment history
    const paymentIndex = user.paymentInfo.paymentHistory.findIndex(p => p.orderId === order_id);
    if (paymentIndex !== -1) {
      user.paymentInfo.paymentHistory[paymentIndex].status = order_status.toLowerCase();
      user.paymentInfo.paymentHistory[paymentIndex].updatedAt = new Date();
    }

    await user.save();

    console.log(`Webhook processed successfully. Status changed from ${previousStatus} to ${order_status.toLowerCase()}`);

    return res.status(200).json({ success: true, message: "Webhook processed" });

  } catch (err) {
    console.error('Webhook Error:', {
      message: err.message,
      stack: err.stack,
      body: req.body
    });

    return res.status(500).json({ 
      success: false, 
      message: "Webhook processing failed" 
    });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "UserId is required" 
      });
    }

    console.log(`Fetching payment history for user: ${userId}`);

    const user = await User.findById(userId).select("paymentInfo");
    if (!user) {
      console.error(`User not found: ${userId}`);
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const paymentHistory = user.paymentInfo?.paymentHistory || [];
    
    console.log(`Found ${paymentHistory.length} payment records for user: ${userId}`);

    return res.status(200).json({ 
      success: true, 
      data: paymentHistory 
    });

  } catch (err) {
    console.error('Get Payment History Error:', {
      message: err.message,
      stack: err.stack,
      userId: req.params.userId
    });

    return res.status(500).json({ 
      success: false, 
      message: "Error fetching payment history" 
    });
  }
};