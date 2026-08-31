const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/** Called once after Firebase sign-up completes on the client, to create the Mongo profile. */
const registerProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, neighborhood, location, volunteerSkills } = req.body;
  const existing = await User.findOne({ firebaseUid: req.firebaseUser.uid });
  if (existing) throw new ApiError(409, 'Profile already exists for this account.');

  const user = await User.create({
    firebaseUid: req.firebaseUser.uid,
    fullName,
    email: req.firebaseUser.email,
    emailVerified: !!req.firebaseUser.email_verified,
    phone,
    neighborhood,
    location,
    volunteerSkills: volunteerSkills || [],
  });

  res.status(201).json({ success: true, data: user });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['fullName', 'phone', 'neighborhood', 'location', 'volunteerSkills', 'availability', 'profilePicture'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();
  res.json({ success: true, data: req.user });
});

const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ success: true, data: user.toPublicJSON() });
});

const devVerifyMe = asyncHandler(async (req, res) => {
  req.user.verificationStatus = 'Verified';
  await req.user.save();
  res.json({ success: true, data: req.user, message: 'Account verified for demo testing.' });
});

module.exports = { registerProfile, getMe, updateMe, getPublicProfile, devVerifyMe };
