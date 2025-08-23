const User = require('../models/User');


// POST /auth/register
exports.register = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      bloodGroup, addresses, occupation, photoUrl
    } = req.body;

    // check if user already exists
    let user = await User.findOne({ phone });
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User already registered' });
    }

    // generate new OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    if (!user) user = new User({ phone });

    user.name = name;
    user.email = email;
    user.password = password;
    user.bloodGroup = bloodGroup;
    user.addresses = addresses;
    user.occupation = occupation;
    user.photoUrl = photoUrl || null;
    user.otp = otp;
    user.isVerified = false;

    await user.save();

    // return OTP in response (mock)
    return res.json({
      message: 'User registered. Please verify OTP.',
      userId: user._id,
      otp: otp
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
