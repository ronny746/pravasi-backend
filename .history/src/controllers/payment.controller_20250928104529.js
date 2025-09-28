// const Razorpay = require('razorpay');
// const crypto = require('crypto');
// const User = require('../models/user.model');

// // Razorpay instance
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// console.log('Razorpay Config:', {
//   keyId: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 10)}...` : 'NOT_SET',
//   keySecret: process.env.RAZORPAY_KEY_SECRET ? `${process.env.RAZORPAY_KEY_SECRET.substring(0, 10)}...` : 'NOT_SET',
// });

// exports.createOrder = async (req, res) => {
//   try {
//     const { userId, amount } = req.body;

//     // Input validation
//     if (!userId || !amount) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "UserId and amount are required" 
//       });
//     }

//     if (amount <= 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Amount must be greater than 0" 
//       });
//     }

//     // Check if user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "User not found" 
//       });
//     }

//     // Validate Razorpay credentials
//     if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
//       console.error('Razorpay credentials not found');
//       return res.status(500).json({ 
//         success: false, 
//         message: "Payment gateway configuration error" 
//       });
//     }

//     console.log(`Creating order for user: ${userId}, amount: ${amount}`);

//     // Create Razorpay order
//     const amountInPaise = amount * 100; // Convert rupees to paise
//     const options = {
//       amount: amountInPaise, // Razorpay expects amount in paise (₹100 = 10000 paise)
//       currency: 'INR',
//       receipt: `receipt_${Date.now()}`,
//       notes: {
//         userId: userId,
//         userEmail: user.email,
//         userPhone: user.phone
//       }
//     };

//     console.log('Razorpay order options:', {
//       ...options,
//       amountInRupees: amount,
//       amountInPaise: amountInPaise
//     });

//     const razorpayOrder = await razorpay.orders.create(options);
    
//     console.log('Razorpay order created:', {
//       id: razorpayOrder.id,
//       amountInPaise: razorpayOrder.amount,
//       amountInRupees: razorpayOrder.amount / 100,
//       status: razorpayOrder.status
//     });

//     // Save initial order to user
//     user.paymentInfo = user.paymentInfo || {};
//     user.paymentInfo.orderId = razorpayOrder.id;
//     user.paymentInfo.amount = amount;
//     user.paymentInfo.status = 'pending';
//     user.paymentInfo.paymentHistory = user.paymentInfo.paymentHistory || [];
    
//     user.paymentInfo.paymentHistory.push({
//       orderId: razorpayOrder.id,
//       amount: parseFloat(amount),
//       status: 'pending',
//       createdAt: new Date()
//     });
    
//     await user.save();

//     console.log(`Order saved successfully: ${razorpayOrder.id}`);

//     return res.status(200).json({ 
//       success: true, 
//       data: {
//         orderId: razorpayOrder.id,
//         amount: razorpayOrder.amount,
//         currency: razorpayOrder.currency,
//         key: process.env.RAZORPAY_KEY_ID // Frontend needs this
//       }
//     });

//   } catch (err) {
//     console.error('Create Order Error:', {
//       message: err.message,
//       error: err.error,
//       stack: err.stack
//     });

//     // Handle Razorpay specific errors
//     if (err.statusCode === 400) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid request data",
//         details: err.error?.description
//       });
//     }

//     if (err.statusCode === 401) {
//       return res.status(500).json({ 
//         success: false, 
//         message: "Payment gateway authentication failed" 
//       });
//     }

//     return res.status(500).json({ 
//       success: false, 
//       message: "Error creating order. Please try again.",
//       error: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// };

// exports.verifyPayment = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     console.log('Payment verification request:', {
//       orderId: razorpay_order_id,
//       paymentId: razorpay_payment_id,
//       signature: razorpay_signature ? 'PROVIDED' : 'MISSING'
//     });

//     // Validate required fields
//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Missing required payment verification data" 
//       });
//     }

//     // Verify signature
//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     const isAuthentic = expectedSignature === razorpay_signature;

//     if (!isAuthentic) {
//       console.error('Payment signature verification failed');
//       return res.status(400).json({ 
//         success: false, 
//         message: "Payment verification failed" 
//       });
//     }

//     console.log('Payment signature verified successfully');

//     // Find user by order ID
//     const user = await User.findOne({ "paymentInfo.orderId": razorpay_order_id });
//     if (!user) {
//       console.error(`User not found for order: ${razorpay_order_id}`);
//       return res.status(404).json({ 
//         success: false, 
//         message: "Order not found" 
//       });
//     }

//     // Update payment status
//     user.paymentInfo.status = 'paid';
//     user.paymentInfo.paymentId = razorpay_payment_id;
//     user.paymentInfo.signature = razorpay_signature;
//     user.isPaid = true;
//     user.paymentInfo.purchasedAt = new Date();
//     user.paymentInfo.expiryAt = null; // lifetime

//     // Update payment history
//     const paymentIndex = user.paymentInfo.paymentHistory.findIndex(p => p.orderId === razorpay_order_id);
//     if (paymentIndex !== -1) {
//       user.paymentInfo.paymentHistory[paymentIndex].status = 'paid';
//       user.paymentInfo.paymentHistory[paymentIndex].paymentId = razorpay_payment_id;
//       user.paymentInfo.paymentHistory[paymentIndex].updatedAt = new Date();
//     }

//     await user.save();

//     console.log(`Payment verified and updated for user: ${user._id}`);

//     return res.status(200).json({ 
//       success: true, 
//       message: "Payment verified successfully" 
//     });

//   } catch (err) {
//     console.error('Payment Verification Error:', {
//       message: err.message,
//       stack: err.stack
//     });

//     return res.status(500).json({ 
//       success: false, 
//       message: "Payment verification failed" 
//     });
//   }
// };

// exports.getPaymentHistory = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     if (!userId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "UserId is required" 
//       });
//     }

//     console.log(`Fetching payment history for user: ${userId}`);

//     const user = await User.findById(userId).select("paymentInfo");
//     if (!user) {
//       console.error(`User not found: ${userId}`);
//       return res.status(404).json({ 
//         success: false, 
//         message: "User not found" 
//       });
//     }

//     const paymentHistory = user.paymentInfo?.paymentHistory || [];
    
//     console.log(`Found ${paymentHistory.length} payment records for user: ${userId}`);

//     return res.status(200).json({ 
//       success: true, 
//       data: paymentHistory 
//     });

//   } catch (err) {
//     console.error('Get Payment History Error:', {
//       message: err.message,
//       stack: err.stack,
//       userId: req.params.userId
//     });

//     return res.status(500).json({ 
//       success: false, 
//       message: "Error fetching payment history" 
//     });
//   }
// };

const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/user.model');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount) return res.status(400).json({ success:false, message:'userId and amount required' });
    if (amount <= 0) return res.status(400).json({ success:false, message:'Amount must be > 0' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success:false, message:'Payment gateway misconfigured' });
    }

    const amountInPaise = Math.round(amount * 100);
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId: String(user._id),
        userEmail: user.email || '',
        userPhone: user.phone || ''
      }
      // payment_capture can be added if needed: payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save to user.paymentInfo & history
    user.paymentInfo = user.paymentInfo || {};
    user.paymentInfo.orderId = razorpayOrder.id;
    user.paymentInfo.amount = amount;
    user.paymentInfo.status = 'pending';
    user.paymentInfo.paymentHistory = user.paymentInfo.paymentHistory || [];
    user.paymentInfo.paymentHistory.push({
      orderId: razorpayOrder.id,
      amount: parseFloat(amount),
      status: 'pending',
      createdAt: new Date()
    });
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (err) {
    console.error('createOrder error', err);
    return res.status(500).json({ success:false, message:'Error creating order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success:false, message:'Missing verification data' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn('Signature mismatch for', razorpay_order_id);
      return res.status(400).json({ success:false, message:'Invalid signature' });
    }

    // Optional: fetch payment to ensure status captured
    // const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Find user by orderId
    const user = await User.findOne({ "paymentInfo.orderId": razorpay_order_id });
    if (!user) return res.status(404).json({ success:false, message:'Order not found' });

    user.paymentInfo.status = 'paid';
    user.paymentInfo.paymentId = razorpay_payment_id;
    user.paymentInfo.signature = razorpay_signature;
    user.isPaid = true;
    user.paymentInfo.purchasedAt = new Date();

    // update history entry
    const idx = (user.paymentInfo.paymentHistory || []).findIndex(x => x.orderId === razorpay_order_id);
    if (idx !== -1) {
      user.paymentInfo.paymentHistory[idx].status = 'paid';
      user.paymentInfo.paymentHistory[idx].paymentId = razorpay_payment_id;
      user.paymentInfo.paymentHistory[idx].updatedAt = new Date();
    }

    await user.save();
    return res.status(200).json({ success:true, message:'Payment verified' });
  } catch (err) {
    console.error('verifyPayment error', err);
    return res.status(500).json({ success:false, message:'Payment verification failed' });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success:false, message:'userId required' });
    const user = await User.findById(userId).select('paymentInfo');
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    return res.status(200).json({ success:true, data: user.paymentInfo.paymentHistory || [] });
  } catch (err) {
    console.error('getPaymentHistory error', err);
    return res.status(500).json({ success:false, message:'Error fetching history' });
  }
};

// Fetch order status from Razorpay
exports.getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ success:false, message:'orderId required' });
    const order = await razorpay.orders.fetch(orderId);
    return res.status(200).json({ success:true, data: order });
  } catch (err) {
    console.error('getOrderStatus error', err);
    return res.status(500).json({ success:false, message:'Error fetching order' });
  }
};

// Refund (full or partial)
exports.refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount } = req.body; // optional in paise for partial refund
    if (!paymentId) return res.status(400).json({ success:false, message:'paymentId required' });
    const refundOptions = amount ? { amount: Math.round(amount) } : {};
    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return res.status(200).json({ success:true, data: refund });
  } catch (err) {
    console.error('refundPayment error', err);
    return res.status(500).json({ success:false, message:'Refund failed' });
  }
};
