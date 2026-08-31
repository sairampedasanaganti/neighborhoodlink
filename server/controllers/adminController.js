const User = require('../models/User');
const HelpRequest = require('../models/HelpRequest');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { notify } = require('../services/notificationService');

const listUsers = asyncHandler(async (req, res) => {
  const { verificationStatus } = req.query;
  const filter = {};
  if (verificationStatus) filter.verificationStatus = verificationStatus;
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

const pendingUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ verificationStatus: 'Pending' }).sort({ createdAt: 1 });
  res.json({ success: true, data: users });
});

const setVerificationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'Verified' | 'Rejected'
  if (!['Verified', 'Rejected'].includes(status)) throw new ApiError(400, 'Status must be Verified or Rejected.');

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  user.verificationStatus = status;
  await user.save();

  await notify({
    user: user._id,
    type: status === 'Verified' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
    message: status === 'Verified'
      ? 'Your community profile has been verified. You now have full access.'
      : 'Your verification request was rejected. Please contact support for details.',
  });

  res.json({ success: true, data: user });
});

const suspendUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  user.isSuspended = true;
  user.suspensionReason = reason || '';
  await user.save();
  res.json({ success: true, data: user });
});

const allRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const requests = await HelpRequest.find(filter)
    .populate('requester', 'fullName')
    .populate('assignedVolunteer', 'fullName')
    .sort({ createdAt: -1 })
    .limit(300);
  res.json({ success: true, data: requests });
});

const stats = asyncHandler(async (req, res) => {
  const [totalUsers, verifiedUsers, pendingRequests, activeRequests, completedRequests, cancelledRequests] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ verificationStatus: 'Verified' }),
      HelpRequest.countDocuments({ status: 'Pending' }),
      HelpRequest.countDocuments({ status: { $in: ['Accepted', 'On the Way', 'In Progress'] } }),
      HelpRequest.countDocuments({ status: 'Completed' }),
      HelpRequest.countDocuments({ status: 'Cancelled' }),
    ]);

  res.json({
    success: true,
    data: { totalUsers, verifiedUsers, pendingRequests, activeRequests, completedRequests, cancelledRequests },
  });
});

module.exports = { listUsers, pendingUsers, setVerificationStatus, suspendUser, allRequests, stats };
