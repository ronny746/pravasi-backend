const User = require('../models/user.model');
const Counter = require('../models/counter.model');

// Standardized response helper
const sendResponse = (res, success, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    statusCode
  });
};

// 🔢 Generate Sequential Public ID (PR00001, etc.)
async function getNextPublicId() {
  const doc = await Counter.findOneAndUpdate(
    { _id: 'user_pr_seq' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const num = String(doc.seq).padStart(5, '0');
  return `PR${num}`;
}

// 📱 SEND OTP
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) return sendResponse(res, false, 'Phone number is required', null, 400);

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return sendResponse(res, false, 'Please enter a valid 10-digit phone number', null, 400);
    }

    let user = await User.findOne({ phone });
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    if (user) {
      user.otp = otp;
      await user.save();

      return sendResponse(res, true, 'OTP sent successfully to your registered phone number', {
        userId: user._id,
        phone: user.phone,
        publicId: user.publicId || null,
        isExistingUser: true,
        otp // remove in production
      });
    }

    // New user registration
    const session = await User.startSession();
    let newUser;
    await session.withTransaction(async () => {
      const publicId = await getNextPublicId();
      newUser = await User.create([{
        phone,
        otp,
        phoneVerified: false,
        publicId
      }], { session });
    });
    session.endSession();

    newUser = newUser[0];

    return sendResponse(res, true, 'OTP sent successfully to your phone number', {
      userId: newUser._id,
      phone: newUser.phone,
      publicId: newUser.publicId,
      isExistingUser: false,
      otp // remove in production
    }, 201);

  } catch (err) {
    console.error('Send OTP error:', err);
    if (err.code === 11000)
      return sendResponse(res, false, 'Duplicate key error (phone/publicId already exists)', null, 409);

    return sendResponse(res, false, 'Internal server error occurred while sending OTP.', null, 500);
  }
};

// ✅ VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return sendResponse(res, false, 'Phone number and OTP are required', null, 400);

    const user = await User.findOne({ phone });
    if (!user)
      return sendResponse(res, false, 'User not found. Please send OTP first.', null, 404);

    const otpGeneratedTime = new Date(user.updatedAt);
    const fiveMinutesInMs = 5 * 60 * 1000;
    if (new Date() - otpGeneratedTime > fiveMinutesInMs)
      return sendResponse(res, false, 'OTP has expired. Please request a new one.', null, 400);

    if (user.otp !== otp)
      return sendResponse(res, false, 'Invalid OTP provided', null, 400);

    user.phoneVerified = true;
    user.otp = null;
    await user.save();

    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    delete userResponse.otp;

    return sendResponse(res, true, 'OTP verified successfully.', {
      userId: user._id,
      phone: user.phone,
      phoneVerified: true,
      user: userResponse
    });

  } catch (err) {
    console.error('Verify OTP error:', err);
    return sendResponse(res, false, 'Internal server error during OTP verification.', null, 500);
  }
};

// 🔁 RESEND OTP
exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return sendResponse(res, false, 'Phone number is required', null, 400);

    const user = await User.findOne({ phone });
    if (!user)
      return sendResponse(res, false, 'User not found. Please send OTP first.', null, 404);
    if (user.phoneVerified)
      return sendResponse(res, false, 'User is already verified', null, 400);

    const timeSinceLastUpdate = new Date() - new Date(user.updatedAt);
    if (timeSinceLastUpdate < 60 * 1000)
      return sendResponse(res, false, 'Please wait 60 seconds before requesting a new OTP', null, 429);

    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = newOtp;
    await user.save();

    return sendResponse(res, true, 'OTP resent successfully', {
      phone: user.phone,
      otp: newOtp // remove in production
    });

  } catch (err) {
    console.error('Resend OTP error:', err);
    return sendResponse(res, false, 'Internal server error while resending OTP.', null, 500);
  }
};

// 🔐 LOGIN
exports.login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if ((!phone && !email) || !password)
      return sendResponse(res, false, 'Phone/email and password required', null, 400);

    const user = await User.findOne({
      $or: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    if (!user)
      return sendResponse(res, false, 'User not found. Please register first.', null, 404);
    if (!user.phoneVerified)
      return sendResponse(res, false, 'Please verify your phone number first', null, 403);
    if (user.password !== password)
      return sendResponse(res, false, 'Invalid credentials', null, 401);

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    delete userResponse.otp;

    return sendResponse(res, true, 'Login successful', {
      userId: user._id,
      user: userResponse
    });

  } catch (err) {
    console.error('Login error:', err);
    return sendResponse(res, false, 'Internal server error during login.', null, 500);
  }
};

// 📸 UPLOAD IMAGE
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file)
      return sendResponse(res, false, 'No image file uploaded', null, 400);

    const imageUrl = `/images/${req.file.filename}`;

    return sendResponse(res, true, 'Image uploaded successfully', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      imageUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

  } catch (err) {
    console.error('Upload Image error:', err);
    return sendResponse(res, false, 'Internal server error while uploading image.', null, 500);
  }
};

// 🧾 UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return sendResponse(res, false, "User ID is required", null, 400);

    const user = await User.findById(userId);
    if (!user)
      return sendResponse(res, false, "User not found", null, 404);

    const updateFields = { ...req.body };

    // Uniqueness checks
    if (updateFields.email && updateFields.email !== user.email) {
      const exists = await User.findOne({ email: updateFields.email, _id: { $ne: userId } });
      if (exists) return sendResponse(res, false, "Email already exists", null, 409);
    }
    if (updateFields.phone && updateFields.phone !== user.phone) {
      const exists = await User.findOne({ phone: updateFields.phone, _id: { $ne: userId } });
      if (exists) return sendResponse(res, false, "Phone number already exists", null, 409);
    }
    if (updateFields.username && updateFields.username !== user.username) {
      const exists = await User.findOne({ username: updateFields.username, _id: { $ne: userId } });
      if (exists) return sendResponse(res, false, "Username already exists", null, 409);
    }

    // 🔹 Check completeness (added city/state/country/pincode)
    const snapshot = { ...user.toObject(), ...updateFields };
    const allRequired = [
      snapshot.nameEn, snapshot.email, snapshot.phone,
      snapshot.bloodGroupEn,
      snapshot.addressCurrentEn, snapshot.addressPermanentEn,
      snapshot.addressCurrentCityEn, snapshot.addressCurrentStateEn,
      snapshot.addressPermanentCityEn, snapshot.addressPermanentStateEn,
      snapshot.occupationTypeEn, snapshot.occupationCompanyEn, snapshot.occupationDesignationEn,
      snapshot.photoUrl
    ];
    updateFields.isAccountCompleted = allRequired.every(v => v && v.toString().trim() !== "");

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true })
      .select("-otp");

    const msg = updateFields.password
      ? (updatedUser.isAccountCompleted
        ? "Profile and password updated successfully. Account is complete."
        : "Profile and password updated successfully. Some fields are missing.")
      : (updatedUser.isAccountCompleted
        ? "Profile updated successfully. Account is complete."
        : "Profile updated successfully. Some fields are missing.");

    return sendResponse(res, true, msg, { user: updatedUser });

  } catch (err) {
    console.error("Update Profile error:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return sendResponse(res, false, `${field} already exists`, null, 409);
    }
    return sendResponse(res, false, "Internal server error while updating profile.", null, 500);
  }
};

// 👤 GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId)
      return sendResponse(res, false, 'User ID is required', null, 400);

    const user = await User.findById(userId).select('-password -otp');
    if (!user)
      return sendResponse(res, false, 'User not found', null, 404);

    return sendResponse(res, true, 'Profile fetched successfully', { user });

  } catch (err) {
    console.error('Get Profile error:', err);
    return sendResponse(res, false, 'Internal server error while fetching profile.', null, 500);
  }
};

// 👥 GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -otp');
    if (!users.length)
      return sendResponse(res, false, 'No users found', [], 404);

    return sendResponse(res, true, 'Users fetched successfully', users);

  } catch (err) {
    console.error('Get All Users error:', err);
    return sendResponse(res, false, 'Internal server error while fetching users.', null, 500);
  }
};

// 🚪 LOGOUT
exports.logout = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId)
      return sendResponse(res, false, 'User ID is required', null, 400);

    const user = await User.findById(userId);
    if (!user)
      return sendResponse(res, false, 'User not found', null, 404);

    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();

    return sendResponse(res, true, 'Logged out successfully');

  } catch (err) {
    console.error('Logout error:', err);
    return sendResponse(res, false, 'Internal server error during logout.', null, 500);
  }
};
