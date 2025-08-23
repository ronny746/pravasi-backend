const User = require('../models/user.model');


exports.register = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      bloodGroup, addresses, occupation, photoUrl
    } = req.body;

    // check if user already exists
    let existingUser = await User.findOne({ phone });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: 'User already registered' });
      } else {
        return res.status(400).json({ message: 'User exists but not verified. Please verify OTP.' });
      }
    }

    // first-time user: create new user
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newUser = new User({
      name,
      email,
      password,
      phone,
      bloodGroup,
      addresses,
      occupation,
      photoUrl: photoUrl || null,
      otp,
      isVerified: false
    });

    await newUser.save();

    return res.status(201).json({
      message: 'User registered successfully. Please verify OTP.',
      userId: newUser._id,
      otp
    });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

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