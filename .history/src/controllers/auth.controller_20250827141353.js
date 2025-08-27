
const User = require('../models/user.model');
const Counter = require('.');


async function getNextPublicId() {
  const doc = await Counter.findOneAndUpdate(
    { _id: 'user_pr_seq' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const num = String(doc.seq).padStart(5, '0'); // 00001, 00002, ...
  return `PR${num}`;
}

// SEND OTP - Direct API for sending OTP (replaces register)
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required', statusCode: 400 });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit phone number', statusCode: 400 });
    }

    let user = await User.findOne({ phone });

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    if (user) {
      // existing user: just refresh OTP
      user.otp = otp;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully to your registered phone number',
        data: {
          userId: user._id,
          phone: user.phone,
          publicId: user.publicId || null,
          isExistingUser: true,
          otp // remove in prod
        },
        statusCode: 200
      });
    } else {
      // NEW user: assign PR id atomically + create
      // optional: use a session/transaction to avoid "burning" a number on rare failures
      const session = await User.startSession();
      let newUser;
      await session.withTransaction(async () => {
        const publicId = await getNextPublicId(); // atomic $inc inside
        newUser = await User.create([{
          phone,
          otp,
          phoneVerified: false,
          publicId
        }], { session });
      });
      session.endSession();

      newUser = newUser[0]; // because create([]) with session returns array

      return res.status(201).json({
        success: true,
        message: 'OTP sent successfully to your phone number',
        data: {
          userId: newUser._id,
          phone: newUser.phone,
          publicId: newUser.publicId,
          isExistingUser: false,
          otp // remove in prod
        },
        statusCode: 201
      });
    }
  } catch (err) {
    console.error('Send OTP error:', err);

    if (err.code === 11000) {
      // could be duplicate phone OR (rarely) duplicate publicId if two processes raced without transaction
      return res.status(409).json({
        success: false,
        message: 'Duplicate key error (phone/publicId already exists)',
        statusCode: 409
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while sending OTP',
      statusCode: 500
    });
  }
};


// VERIFY OTP - Enhanced with expiry and attempt limits
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

    // Check if OTP has expired - Using basic time check (5 minutes)
    const otpGeneratedTime = new Date(user.updatedAt);
    const currentTime = new Date();
    const timeDifference = currentTime - otpGeneratedTime;
    const fiveMinutesInMs = 5 * 60 * 1000;

    if (timeDifference > fiveMinutesInMs) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
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
    user.phoneVerified = true;
    user.otp = null;
    await user.save();

    // Remove sensitive data from response
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    delete userResponse.otp;

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now update your profile.',
      data: {
        userId: user._id,
        phone: user.phone,
        phoneVerified: true,
        user: userResponse
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

// RESEND OTP - Users can resend OTP multiple times with basic rate limiting
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
        message: 'User not found with this phone number. Please send OTP first.',
        statusCode: 404
      });
    }

    if (user.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'User is already verified',
        statusCode: 400
      });
    }

    // Basic rate limiting using updatedAt field (allow resend every 60 seconds)
    if (user.updatedAt) {
      const timeSinceLastUpdate = new Date() - new Date(user.updatedAt);
      const minInterval = 60 * 1000; // 60 seconds

      if (timeSinceLastUpdate < minInterval) {
        const remainingTime = Math.ceil((minInterval - timeSinceLastUpdate) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingTime} seconds before requesting a new OTP`,
          statusCode: 429
        });
      }
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

    // Check if user is phone verified
    if (!user.phoneVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your phone number first',
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

    // Update user online status and last seen
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

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

// UPLOAD IMAGE
exports.uploadImage = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded',
        statusCode: 400
      });
    }

    // Get file details
    const imageUrl = `/images/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        imageUrl: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      statusCode: 200
    });

  } catch (err) {
    console.error('Upload Image error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while uploading image',
      statusCode: 500
    });
  }
};

// UPDATE PASSWORD
// UPDATE PROFILE - Enhanced with password update functionality
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required", statusCode: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found", statusCode: 404 });
    }

    // if (!user.phoneVerified) {
    //   return res.status(403).json({ success: false, message: "Please verify your phone number first", statusCode: 403 });
    // }

    const {
      nameEn, nameHi, email, phone, username, 
      password, // Added password fields
      bloodGroupEn, bloodGroupHi,
      addressCurrentEn, addressCurrentHi,
      addressPermanentEn, addressPermanentHi,
      occupationTypeEn, occupationTypeHi,
      occupationCompanyEn, occupationCompanyHi,
      occupationDesignationEn, occupationDesignationHi,
      photoUrl, deviceToken
    } = req.body;

    // Password update validation (if user wants to update password)
    // if (password) {
    //   // Check if old password is provided
    //   if (!oldPassword) {
    //     return res.status(400).json({
    //       success: false,
    //       message: 'Old password is required to update password',
    //       statusCode: 400
    //     });
    //   }

    //   // Verify old password
    //   if (user.password !== oldPassword) {
    //     return res.status(400).json({
    //       success: false,
    //       message: 'Old password is incorrect',
    //       statusCode: 400
    //     });
    //   }

    //   // Check if new password is same as old password
    //   if (oldPassword === password) {
    //     return res.status(400).json({
    //       success: false,
    //       message: 'New password cannot be the same as old password',
    //       statusCode: 400
    //     });
    //   }

    //   // Check password length
    //   if (password.length < 6) {
    //     return res.status(400).json({
    //       success: false,
    //       message: 'New password must be at least 6 characters long',
    //       statusCode: 400
    //     });
    //   }
    // }

    // Uniqueness checks
    if (email && email !== user.email) {
      const exists = await User.findOne({ email, _id: { $ne: userId } });
      if (exists) return res.status(409).json({ success: false, message: "Email already exists", statusCode: 409 });
    }
    if (phone && phone !== user.phone) {
      const exists = await User.findOne({ phone, _id: { $ne: userId } });
      if (exists) return res.status(409).json({ success: false, message: "Phone number already exists", statusCode: 409 });
    }
    if (username && username !== user.username) {
      const exists = await User.findOne({ username, _id: { $ne: userId } });
      if (exists) return res.status(409).json({ success: false, message: "Username already exists", statusCode: 409 });
    }

    // Collect update fields
    const updateFields = {};
    if (nameEn !== undefined) updateFields.nameEn = nameEn;
    if (nameHi !== undefined) updateFields.nameHi = nameHi;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (username !== undefined) updateFields.username = username;
    if (password !== undefined) updateFields.password = password; // Include password if provided
    if (bloodGroupEn !== undefined) updateFields.bloodGroupEn = bloodGroupEn;
    if (bloodGroupHi !== undefined) updateFields.bloodGroupHi = bloodGroupHi;
    if (addressCurrentEn !== undefined) updateFields.addressCurrentEn = addressCurrentEn;
    if (addressCurrentHi !== undefined) updateFields.addressCurrentHi = addressCurrentHi;
    if (addressPermanentEn !== undefined) updateFields.addressPermanentEn = addressPermanentEn;
    if (addressPermanentHi !== undefined) updateFields.addressPermanentHi = addressPermanentHi;
    if (occupationTypeEn !== undefined) updateFields.occupationTypeEn = occupationTypeEn;
    if (occupationTypeHi !== undefined) updateFields.occupationTypeHi = occupationTypeHi;
    if (occupationCompanyEn !== undefined) updateFields.occupationCompanyEn = occupationCompanyEn;
    if (occupationCompanyHi !== undefined) updateFields.occupationCompanyHi = occupationCompanyHi;
    if (occupationDesignationEn !== undefined) updateFields.occupationDesignationEn = occupationDesignationEn;
    if (occupationDesignationHi !== undefined) updateFields.occupationDesignationHi = occupationDesignationHi;
    if (photoUrl !== undefined) updateFields.photoUrl = photoUrl;
    if (deviceToken !== undefined) updateFields.deviceToken = deviceToken;

    // 🔑 Merge DB user + updateFields
    const snapshot = { ...user.toObject(), ...updateFields };

    // Required fields list
    const allRequired = [
      snapshot.nameEn, snapshot.email, snapshot.phone,
      snapshot.bloodGroupEn, snapshot.addressCurrentEn, snapshot.addressPermanentEn,
      snapshot.occupationTypeEn, snapshot.occupationCompanyEn, snapshot.occupationDesignationEn,
      snapshot.photoUrl
    ];

    updateFields.isAccountCompleted = allRequired.every(field => field && field.toString().trim() !== "");

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true })
      .select("-otp");

    // Custom success message for password update
    let successMessage = updatedUser.isAccountCompleted
      ? "Profile updated successfully. Account is complete."
      : "Profile updated successfully. Some fields are still missing.";

    if (password) {
      successMessage = updatedUser.isAccountCompleted
        ? "Profile and password updated successfully. Account is complete."
        : "Profile and password updated successfully. Some fields are still missing.";
    }

    return res.status(200).json({
      success: true,
      message: successMessage,
      data: { user: updatedUser },
      statusCode: 200
    });

  } catch (err) {
    console.error("Update Profile error:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, message: `${field} already exists`, statusCode: 409 });
    }
    return res.status(500).json({ success: false, message: "Internal server error", statusCode: 500 });
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

    const user = await User.findById(userId).select('-password -otp');

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

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -otp');

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
      count: users.length,
      statusCode: 200
    });

  } catch (err) {
    console.error('Get All Users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching users',
      statusCode: 500
    });
  }
};

// LOGOUT - Update user online status
exports.logout = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        statusCode: 400
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        statusCode: 404
      });
    }

    // Update user offline status
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      statusCode: 200
    });

  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred during logout',
      statusCode: 500
    });
  }
};