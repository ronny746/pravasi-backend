// dashboard.controller.js
const User = require('../models/user.model');

// GET DASHBOARD DATA - Returns complete dashboard statistics and user list
exports.getDashboardData = async (req, res) => {
  try {
    // Get total count of all users
    const totalPravasi = await User.countDocuments({});
    
    // Get count of verified users (users with phoneVerified: true OR emailVerified: true)
    const verifiedPravasi = await User.countDocuments({
      $or: [
        { isVerified: true }
      ]
    });
    
    // Get count of unverified users
    const unverifiedPravasi = await User.countDocuments({
      isVerified: false
    });
    
    // Get list of users with required fields for the list view
    const pravasiBoys = await User.find({}, {
      _id: 1,
      nameEn: 1,
      nameHi: 1,
      photoUrl: 1,
      occupationDesignationEn: 1,
      occupationDesignationHi: 1,
      addressCurrentEn: 1,
      addressCurrentHi: 1,
      addressPermanentEn: 1,
      addressPermanentHi: 1,
      bloodGroupEn: 1,
      bloodGroupHi: 1,
      phone: 1,
      isVerified: 1,
      phoneVerified: 1,
      emailVerified: 1,
      isPaid: 1,
      isOnline: 1,
      lastSeen: 1,
      createdAt: 1
    }).sort({ createdAt: -1 }); // Sort by newest first
    
    // Format the user data for frontend
    const formattedPravasiBoys = pravasiBoys.map(user => ({
      id: user._id,
      name: user.nameEn || user.nameHi || 'N/A',
      nameHi: user.nameHi || user.nameEn || 'N/A',
      photo: user.photoUrl || null,
      occupation: user.occupationDesignationEn || user.occupationDesignationHi || 'N/A',
      occupationHi: user.occupationDesignationHi || user.occupationDesignationEn || 'N/A',
      currentCity: user.addressCurrentEn || user.addressCurrentHi || 'N/A',
      currentCityHi: user.addressCurrentHi || user.addressCurrentEn || 'N/A',
      permanentCity: user.addressPermanentEn || user.addressPermanentHi || 'N/A',
      permanentCityHi: user.addressPermanentHi || user.addressPermanentEn || 'N/A',
      bloodGroup: user.bloodGroupEn || user.bloodGroupHi || 'N/A',
      bloodGroupHi: user.bloodGroupHi || user.bloodGroupEn || 'N/A',
      phone: user.phone,
      isVerified: user.isVerified,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      isPaid: user.isPaid,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      joinedDate: user.createdAt,
      pravasiBoyId: `PRO${user._id.toString().slice(-4).padStart(4, '0')}`
    }));
    
    // Get some featured/top users (you can modify this logic as needed)
    const featuredUser = pravasiBoys.length > 0 ? {
      id: pravasiBoys[0]._id,
      pravasiBoyId: `PRO${pravasiBoys[0]._id.toString().slice(-4).padStart(4, '0')}`,
      name: pravasiBoys[0].nameEn || pravasiBoys[0].nameHi || 'AJAY RAJ',
      bloodGroup: pravasiBoys[0].bloodGroupEn || pravasiBoys[0].bloodGroupHi || 'B+',
      photo: pravasiBoys[0].photoUrl || null
    } : {
      id: 'default',
      pravasiBoyId: 'PRO0001',
      name: 'AJAY RAJ',
      bloodGroup: 'B+',
      photo: null
    };

    return res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        statistics: {
          totalPravasi: totalPravasi,
          verifiedPravasi: verifiedPravasi,
          unverifiedPravasi: unverifiedPravasi
        },
        featuredUser: featuredUser,
        pravasiBoysList: formattedPravasiBoys,
        location: {
          city: 'Gurgaon',
          state: 'Haryana'
        },
        organization: {
          name: 'RAJASTHAN PRAVASI FOUNDATION',
          tagline: 'राजस्थानी समुदाय की सेवा में समर्पित'
        }
      },
      statusCode: 200
    });

  } catch (err) {
    console.error('Get Dashboard Data error:', err);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching dashboard data',
      statusCode: 500
    });
  }
};

// GET PRAVASI BOYS LIST - Separate endpoint for just the list with pagination
exports.getPravasiBoysList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Optional filters
    const filters = {};
    if (req.query.verified) {
      if (req.query.verified === 'true') {
        filters.$or = [
          { phoneVerified: true },
          { emailVerified: true }
        ];
      } else if (req.query.verified === 'false') {
        filters.phoneVerified = false;
        filters.emailVerified = false;
      }
    }
    
    if (req.query.city) {
      filters.$or = [
        { addressCurrentEn: new RegExp(req.query.city, 'i') },
        { addressCurrentHi: new RegExp(req.query.city, 'i') }
      ];
    }
    
    const total = await User.countDocuments(filters);
    const users = await User.find(filters, {
      _id: 1,
      nameEn: 1,
      nameHi: 1,
      photoUrl: 1,
      occupationDesignationEn: 1,
      occupationDesignationHi: 1,
      addressCurrentEn: 1,
      addressCurrentHi: 1,
      addressPermanentEn: 1,
      addressPermanentHi: 1,
      bloodGroupEn: 1,
      bloodGroupHi: 1,
      phone: 1,
      isVerified: 1,
      phoneVerified: 1,
      emailVerified: 1,
      isPaid: 1,
      isOnline: 1,
      lastSeen: 1,
      createdAt: 1
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    const formattedUsers = users.map(user => ({
      id: user._id,
      pravasiBoyId: `PRO${user._id.toString().slice(-4).padStart(4, '0')}`,
      name: user.nameEn || user.nameHi || 'N/A',
      nameHi: user.nameHi || user.nameEn || 'N/A',
      photo: user.photoUrl || null,
      occupation: user.occupationDesignationEn || user.occupationDesignationHi || 'N/A',
      occupationHi: user.occupationDesignationHi || user.occupationDesignationEn || 'N/A',
      currentCity: user.addressCurrentEn || user.addressCurrentHi || 'N/A',
      currentCityHi: user.addressCurrentHi || user.addressCurrentEn || 'N/A',
      permanentCity: user.addressPermanentEn || user.addressPermanentHi || 'N/A',
      permanentCityHi: user.addressPermanentHi || user.addressPermanentEn || 'N/A',
      bloodGroup: user.bloodGroupEn || user.bloodGroupHi || 'N/A',
      bloodGroupHi: user.bloodGroupHi || user.bloodGroupEn || 'N/A',
      phone: user.phone,
      isVerified: user.isVerified,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      isPaid: user.isPaid,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      joinedDate: user.createdAt
    }));
    
    return res.status(200).json({
      success: true,
      message: 'Pravasi boys list retrieved successfully',
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      },
      statusCode: 200
    });

  } catch (err) {
    console.error('Get Pravasi Boys List error:', err);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching pravasi boys list',
      statusCode: 500
    });
  }
};