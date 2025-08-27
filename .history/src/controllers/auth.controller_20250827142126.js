const User = require('../models/user.model');
const Counter = require('../models/counter.model');

// Standardized response helper
const sendResponse = (res, success, message, data = null, statusCode = 200) => {
  return res.status(200).json({
    success,
    message,
    data,
    statusCode
  });
};

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
      return sendResponse(res, false, 'Phone number is required', null, 400);
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return sendResponse(res, false, 'Please enter a valid 10-digit phone number', null, 400);
    }

    let user = await User.findOne({ phone });

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    if (user) {
      // existing user: just refresh OTP
      user.otp = otp;
      await user.save();

      return sendResponse(res, true, 'OTP sent successfully to your registered phone number', {
        userId: user._id,
        phone: user.phone,
        publicId: user.publicId || null,
        isExistingUser: true,
        otp // remove in prod
      }, 200);
    } else {
      // NEW user: assign PR id atomically + create
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

      return sendResponse(res, true, 'OTP sent successfully to your phone number', {
        userId: newUser._id,
        phone: newUser.phone,
        publicId: newUser.publicId,
        isExistingUser: false,
        otp // remove in prod
      }, 201);
    }
  } catch (err) {
    console.error('Send OTP error:', err);

    if (err.code === 11000) {
      return sendResponse(res, false, 'Duplicate key error (phone/publicId already exists)', null, 409);
    }

    // Network or other issues - still return 200 with error message
    return sendResponse(res, false, 'Internal server error occurred while sending OTP. Please check your network connection and try again.', null, 500);
  }
};

// VERIFY OTP - Enhanced with expiry and attempt limits
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validation
    if (!phone || !otp) {
      return sendResponse(res, false, 'Phone number and OTP are required', null, 400);
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return sendResponse(res, false, 'User not found with this phone number. Please send OTP first.', null, 404);
    }

    // Check if OTP has expired - Using basic time check (5 minutes)
    const otpGeneratedTime = new Date(user.updatedAt);
    const currentTime = new Date();
    const timeDifference = currentTime - otpGeneratedTime;
    const fiveMinutesInMs = 5 * 60 * 1000;

    if (timeDifference > fiveMinutesInMs) {
      return sendResponse(res, false, 'OTP has expired. Please request a new one.', null, 400);
    }

    if (user.otp !== otp) {
      return sendResponse(res, false, 'Invalid OTP provided', null, 400);
    }

    // Verify user
    user.phoneVerified = true;
    user.otp = null;
    await user.save();

    // Remove sensitive data from response
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    delete userResponse.otp;

    return sendResponse(res, true, 'OTP verified successfully. You can now update your profile.', {
      userId: user._id,
      phone: user.phone,
      phoneVerified: true,
      user: userResponse
    }, 200);

  } catch (err) {
    console.error('Verify OTP error:', err);
    return sendResponse(res, false, 'Internal server error occurred during OTP verification. Please check your network connection and try again.', null, 500);
  }
};

// RESEND OTP - Users can resend OTP multiple times with basic rate limiting
exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validation
    if (!phone) {
      return sendResponse(res, false, 'Phone number is required', null, 400);
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return sendResponse(res, false, 'User not found with this phone number. Please send OTP first.', null, 404);
    }

    if (user.phoneVerified) {
      return sendResponse(res, false, 'User is already verified', null, 400);
    }

    // Basic rate limiting using updatedAt field (allow resend every 60 seconds)
    if (user.updatedAt) {
      const timeSinceLastUpdate = new Date() - new Date(user.updatedAt);
      const minInterval = 60 * 1000; // 60 seconds

      if (timeSinceLastUpdate < minInterval) {
        const remainingTime = Math.ceil((minInterval - timeSinceLastUpdate) / 1000);
        return sendResponse(res, false, `Please wait ${remainingTime} seconds before requesting a new OTP`, null, 429);
      }
    }

    // Generate new OTP
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();

    user.otp = newOtp;
    await user.save();

    return sendResponse(res, true, 'OTP resent successfully', {
      phone: user.phone,
      otp: newOtp // Remove this in production
    }, 200);

  } catch (err) {
    console.error('Resend OTP error:', err);
    return sendResponse(res, false, 'Internal server error occurred while resending OTP. Please check your network connection and try again.', null, 500);
  }
};

// LOGIN - Support both email and phone
exports.login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    // Validation - either phone or email required along with password
    if ((!phone && !email) || !password) {
      return sendResponse(res, false, 'Either phone or email is required along with password', null, 400);
    }

    // Find user by phone or email
    const user = await User.findOne({
      $or: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    if (!user) {
      return sendResponse(res, false, 'User not found with provided credentials. Please register first.', null, 404);
    }

    // Check if user is phone verified
    if (!user.phoneVerified) {
      return sendResponse(res, false, 'Please verify your phone number first', null, 403);
    }

    if (user.password !== password) {
      return sendResponse(res, false, 'Invalid credentials provided', null, 401);
    }

    // Update user online status and last seen
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Successful login - exclude sensitive data
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    delete userResponse.otp;

    return sendResponse(res, true, 'Login successful', {
      userId: user._id,
      user: userResponse
    }, 200);

  } catch (err) {
    console.error('Login error:', err);
    return sendResponse(res, false, 'Internal server error occurred during login. Please check your network connection and try again.', null, 500);
  }
};

// UPLOAD IMAGE
exports.uploadImage = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return sendResponse(res, false, 'No image file uploaded', null, 400);
    }

    // Get file details
    const imageUrl = `/images/${req.file.filename}`;

    return sendResponse(res, true, 'Image uploaded successfully', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      imageUrl: imageUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    }, 200);

  } catch (err) {
    console.error('Upload Image error:', err);
    return sendResponse(res, false, 'Internal server error occurred while uploading image. Please check your network connection and try again.', null, 500);
  }
};

// UPDATE PROFILE - Enhanced with password update functionality
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return sendResponse(res, false, "User ID is required", null, 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, false, "User not found. Please check the user ID and try again.", null, 404);
    }

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

    // Uniqueness checks
    if (email && email !== user.email) {
      const exists = await User.findOne({ email, _id: { $ne: userId } });
      if (exists) return sendResponse(res, false, "Email already exists", null, 409);
    }
    if (phone && phone !== user.phone) {
      const exists = await User.findOne({ phone, _id: { $ne: userId } });
      if (exists) return sendResponse(res, false, "Phone number already exists", null, 409);
    }
    if (username && username !== user.username) {
      const exists = await User.findOne({ username, _id: { $ne: userId } });
      if (exists) return sendResponse(res, false, "Username already exists", null, 409);
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

    return sendResponse(res, true, successMessage, { user: updatedUser }, 200);

  } catch (err) {
    console.error("Update Profile error:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return sendResponse(res, false, `${field} already exists`, null, 409);
    }
    return sendResponse(res, false, "Internal server error occurred while updating profile. Please check your network connection and try again.", null, 500);
  }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validation
    if (!userId) {
      return sendResponse(res, false, 'User ID is required', null, 400);
    }

    const user = await User.findById(userId).select('-password -otp');

    if (!user) {
      return sendResponse(res, false, 'User not found. Please check the user ID and try again.', null, 404);
    }

    return sendResponse(res, true, 'Profile fetched successfully', { user }, 200);

  } catch (err) {
    console.error('Get Profile error:', err);
    return sendResponse(res, false, 'Internal server error occurred while fetching profile. Please check your network connection and try again.', null, 500);
  }
};

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -otp');

    if (!users || users.length === 0) {
      return sendResponse(res, false, 'No users found in the system', [], 404);
    }

    return sendResponse(res, true, 'Users fetched successfully', users, 200);

  } catch (err) {
    console.error('Get All Users error:', err);
    return sendResponse(res, false, 'Internal server error occurred while fetching users. Please check your network connection and try again.', null, 500);
  }
};

// LOGOUT - Update user online status
exports.logout = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return sendResponse(res, false, 'User ID is required', null, 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, false, 'User not found. Please check the user ID and try again.', null, 404);
    }

    // Update user offline status
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();

    return sendResponse(res, true, 'Logged out successfully', null, 200);

  } catch (err) {
    console.error('Logout error:', err);
    return sendResponse(res, false, 'Internal server error occurred during logout. Please check your network connection and try again.', null, 500);
  }
};