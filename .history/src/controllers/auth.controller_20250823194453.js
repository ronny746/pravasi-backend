const User = require('../models/user.model');

// REGISTER - No mandatory fields, just basic validation
exports.register = async (req, res) => {
  try {
    const {
      nameEn, nameHi, email, password, phone,
      bloodGroupEn, bloodGroupHi,
      addressCurrentEn, addressCurrentHi,
      addressPermanentEn, addressPermanentHi,
      occupationTypeEn, occupationTypeHi,
      occupationCompanyEn, occupationCompanyHi,
      occupationDesignationEn, occupationDesignationHi,
      photoUrl
    } = req.body;

    // Basic validation - only phone and password required
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and password are required',
        statusCode: 400
      });
    }

    // Check if user already exists with phone or email
    const existingUser = await User.findOne({
      $or: [
        { phone },
        ...(email ? [{ email }] : [])
      ]
    });

    if (existingUser) {
      if (existingUser.phone === phone) {
        if (existingUser.isVerified) {
          return res.status(409).json({
            success: false,
            message: 'User with this phone number already exists and is verified',
            statusCode: 409
          });
        } else {
          return res.status(409).json({
            success: false,
            message: 'User with this phone number exists but not verified. Please verify OTP first.',
            statusCode: 409
          });
        }
      }
      
      if (email && existingUser.email === email) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
          statusCode: 409
        });
      }
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Create new user
    const newUser = new User({
      nameEn: nameEn || null,
      nameHi: nameHi || null,
      email: email || null,
      password,
      phone,
      bloodGroupEn: bloodGroupEn || null,
      bloodGroupHi: bloodGroupHi || null,
      addressCurrentEn: addressCurrentEn || null,
      addressCurrentHi: addressCurrentHi || null,
      addressPermanentEn: addressPermanentEn || null,
      addressPermanentHi: addressPermanentHi || null,
      occupationTypeEn: occupationTypeEn || null,
      occupationTypeHi: occupationTypeHi || null,
      occupationCompanyEn: occupationCompanyEn || null,
      occupationCompanyHi: occupationCompanyHi || null,
      occupationDesignationEn: occupationDesignationEn || null,
      occupationDesignationHi: occupationDesignationHi || null,
      photoUrl: photoUrl || null,
      otp,
      isVerified: false
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify OTP to complete registration.',
      data: {
        userId: newUser._id,
        phone: newUser.phone,
        otp // Remove this in production
      },
      statusCode: 201
    });

  } catch (err) {
    console.error('Register error:', err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`,
        statusCode: 409
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred during registration',
      statusCode: 500
    });
  }
};

// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validation
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required',
        statusCode: 400
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this phone number',
        statusCode: 404
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User is already verified',
        statusCode: 400
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP provided',
        statusCode: 400
      });
    }

    // Verify user
    user.isVerified = true;
    user.otp = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Registration completed.',
      data: {
        userId: user._id,
        phone: user.phone
      },
      statusCode: 200
    });

  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred during OTP verification',
      statusCode: 500
    });
  }
};

// RESEND OTP
exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
        statusCode: 400
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this phone number',
        statusCode: 404
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User is already verified',
        statusCode: 400
      });
    }

    // Generate new OTP
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = newOtp;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        phone: user.phone,
        otp: newOtp // Remove this in production
      },
      statusCode: 200
    });

  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while resending OTP',
      statusCode: 500
    });
  }
};

// LOGIN - Support both email and phone
exports.login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    // Validation - either phone or email required along with password
    if ((!phone && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Either phone or email is required along with password',
        statusCode: 400
      });
    }

    // Find user by phone or email
    const query = {};
    if (phone) query.phone = phone;
    if (email) query.email = email;

    const user = await User.findOne({
      $or: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with provided credentials',
        statusCode: 404
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'User account is not verified. Please verify OTP first.',
        statusCode: 403
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials provided',
        statusCode: 401
      });
    }

    // Successful login - exclude sensitive data
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    delete userResponse.otp;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        user: userResponse
      },
      statusCode: 200
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred during login',
      statusCode: 500
    });
  }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        statusCode: 400
      });
    }

    const user = await User.findById(userId).select('-otp');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: {
        user
      },
      statusCode: 200
    });

  } catch (err) {
    console.error('Get Profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching profile',
      statusCode: 500
    });
  }
};