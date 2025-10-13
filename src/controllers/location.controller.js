// controllers/location.controller.js
const { Country, State, City } = require('country-state-city');


const sendResponse = (res, success, message, data = null, statusCode = 200) => {
  return res.status(200).json({
    success,
    message,
    data,
    statusCode
  });
};
// ✅ Get all Indian states
exports.getStates = async (req, res) => {
  try {
    const states = State.getStatesOfCountry('IN');
    return sendResponse(res, true, 'States fetched successfully', states, 200);
  } catch (err) {
    console.error('Get States error:', err);
    return sendResponse(res, false, 'Error fetching states', null, 500);
  }
};

// ✅ Get districts (in this lib, "district" is not separated — cities are grouped under states)
exports.getCitiesByState = async (req, res) => {
  try {
    const { stateCode } = req.params;
    if (!stateCode) return sendResponse(res, false, 'State code is required', null, 400);

    const cities = City.getCitiesOfState('IN', stateCode);
    return sendResponse(res, true, 'Cities fetched successfully', cities, 200);
  } catch (err) {
    console.error('Get Cities error:', err);
    return sendResponse(res, false, 'Error fetching cities', null, 500);
  }
};

// ✅ Get all cities in India (if needed)
exports.getAllCities = async (req, res) => {
  try {
    const cities = City.getCitiesOfCountry('IN');
    return sendResponse(res, true, 'All cities fetched successfully', cities, 200);
  } catch (err) {
    console.error('Get All Cities error:', err);
    return sendResponse(res, false, 'Error fetching all cities', null, 500);
  }
};
