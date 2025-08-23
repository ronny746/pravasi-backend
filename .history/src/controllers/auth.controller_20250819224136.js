const User = require('../models/User');

// POST /auth/send-otp
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });

    // generate 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone });
    }

    user.otp = otp;
    await user.save();

    // NOTE: return otp in response (mock)
    return res.json({ message: 'OTP generated', otp });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.isVerified = true;
    user.otp = null;           // clear otp after verification
    await user.save();

    return res.json({ message: 'OTP verified successfully', userId: user._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
