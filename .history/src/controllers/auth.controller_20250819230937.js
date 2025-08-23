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

exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ message: 'Phone and password required' });
        }

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: 'User not verified. Please verify OTP.' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // optionally, generate JWT here for auth
        return res.json({
            message: 'Login successful',
            userId: user._id,
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                bloodGroup: user.bloodGroup,
                addresses: user.addresses,
                occupation: user.occupation,
                photoUrl: user.photoUrl
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// GET PROFILE API
exports.getProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .select('-password -otp')
            .populate('occupation'); // <-- populate occupation
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({
            message: 'Profile fetched successfully',
            user
        });

    } catch (err) {
        console.error('GetProfile error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};
