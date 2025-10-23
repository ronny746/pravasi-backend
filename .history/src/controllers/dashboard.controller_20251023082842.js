// dashboard.controller.js
const User = require('../models/user.model');

// Standardized response helper
const sendResponse = (res, success, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    statusCode
  });
};

// GET DASHBOARD DATA - with optional filters for state, city, district
exports.getDashboardData = async (req, res) => {
  try {
    const { state, city, district } = req.query;

    const filters = {};
    if (state) {
      filters.$or = [
        { 'addressCurrentStateEn': new RegExp(state, 'i') },
        { 'addressCurrentStateHi': new RegExp(state, 'i') },
        { 'addressPermanentStateEn': new RegExp(state, 'i') },
        { 'addressPermanentStateHi': new RegExp(state, 'i') }
      ];
    }
    if (city) {
      filters.$or = filters.$or || [];
      filters.$or.push(
        { 'addressCurrentCityEn': new RegExp(city, 'i') },
        { 'addressCurrentCityHi': new RegExp(city, 'i') },
        { 'addressPermanentCityEn': new RegExp(city, 'i') },
        { 'addressPermanentCityHi': new RegExp(city, 'i') }
      );
    }
    if (district) {
      // if you have district fields, add similar regex search
      filters.$or = filters.$or || [];
      filters.$or.push(
        { 'addressCurrentDistrictEn': new RegExp(district, 'i') },
        { 'addressCurrentDistrictHi': new RegExp(district, 'i') },
        { 'addressPermanentDistrictEn': new RegExp(district, 'i') },
        { 'addressPermanentDistrictHi': new RegExp(district, 'i') }
      );
    }

    // Total count with filters
    const totalPravasi = await User.countDocuments(filters);
    
    // Verified / Unverified counts
    const verifiedPravasi = await User.countDocuments({ ...filters, isVerified: true });
    const unverifiedPravasi = await User.countDocuments({ ...filters, isVerified: false });

    // Users list
    const pravasiBoys = await User.find(filters, {
      _id: 1,
      publicId: 1,
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
    }).sort({ createdAt: -1 });

    // Format response
    const formattedPravasiBoys = pravasiBoys.map(user => ({
      id: user._id,
      publicId: user.publicId,
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

    return sendResponse(res, true, 'Dashboard data retrieved successfully', {
      statistics: {
        totalPravasi,
        verifiedPravasi,
        unverifiedPravasi
      },
      pravasiList: formattedPravasiBoys
    }, 200);

  } catch (err) {
    console.error('Get Dashboard Data error:', err);
    return sendResponse(res, false, 'Internal server error occurred while fetching dashboard data.', null, 500);
  }
};

// GET PRAVASI BOYS LIST - with state/city/district filters & pagination
exports.getPravasiBoysList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { state, city, district, verified } = req.query;
    const filters = {};

    // Verified filter
    if (verified === 'true') {
      filters.$or = [
        { phoneVerified: true },
        { emailVerified: true }
      ];
    } else if (verified === 'false') {
      filters.phoneVerified = false;
      filters.emailVerified = false;
    }

    // State / city / district filters
    if (state) {
      filters.$or = filters.$or || [];
      filters.$or.push(
        { 'addressCurrentStateEn': new RegExp(state, 'i') },
        { 'addressCurrentStateHi': new RegExp(state, 'i') },
        { 'addressPermanentStateEn': new RegExp(state, 'i') },
        { 'addressPermanentStateHi': new RegExp(state, 'i') }
      );
    }
    if (city) {
      filters.$or = filters.$or || [];
      filters.$or.push(
        { 'addressCurrentCityEn': new RegExp(city, 'i') },
        { 'addressCurrentCityHi': new RegExp(city, 'i') },
        { 'addressPermanentCityEn': new RegExp(city, 'i') },
        { 'addressPermanentCityHi': new RegExp(city, 'i') }
      );
    }
    if (district) {
      filters.$or = filters.$or || [];
      filters.$or.push(
        { 'addressCurrentDistrictEn': new RegExp(district, 'i') },
        { 'addressCurrentDistrictHi': new RegExp(district, 'i') },
        { 'addressPermanentDistrictEn': new RegExp(district, 'i') },
        { 'addressPermanentDistrictHi': new RegExp(district, 'i') }
      );
    }

    const total = await User.countDocuments(filters);
    const users = await User.find(filters)
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

    return sendResponse(res, true, 'Pravasi boys list retrieved successfully', {
      users: formattedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }, 200);

  } catch (err) {
    console.error('Get Pravasi Boys List error:', err);
    return sendResponse(res, false, 'Internal server error occurred while fetching pravasi boys list.', null, 500);
  }
};
