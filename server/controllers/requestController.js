const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { calculatePriority } = require('../services/priorityEngine');
const { rankVolunteers } = require('../services/matchingEngine');
const { notify } = require('../services/notificationService');

const VALID_TRANSITIONS = {
  Accepted: ['On the Way', 'In Progress', 'Cancelled'],
  'On the Way': ['In Progress', 'Completed', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
};

/** Create a new help request. Priority is computed server-side, never trusted from client. */
const createRequest = asyncHandler(async (req, res) => {
  const { title, description, category, location, requesterUrgency, requiredSkill } = req.body;

  const { score, priority, explanation } = calculatePriority({
    category, requesterUrgency, description,
  });

  const request = await HelpRequest.create({
    requester: req.user._id,
    title, description, category, location, requesterUrgency,
    requiredSkill,
    priority, priorityScore: score, priorityExplanation: explanation,
  });

  // Notify a shortlist of well-matched, available, verified volunteers
  const candidates = await User.find({
    _id: { $ne: req.user._id },
    verificationStatus: 'Verified',
    isSuspended: false,
    availability: { $ne: 'Unavailable' },
  }).limit(200);

  const ranked = rankVolunteers(candidates, request).filter((r) => r.score >= 40).slice(0, 10);
  await Promise.all(
    ranked.map((r) =>
      notify({
        user: r.volunteer._id,
        type: 'NEW_MATCHING_REQUEST',
        message: `New ${category} request near you: "${title}" (${priority} priority)`,
        relatedRequest: request._id,
      })
    )
  );

  res.status(201).json({ success: true, data: request });
});

/** Browse open (Pending) requests with filters + sort. */
const browseRequests = asyncHandler(async (req, res) => {
  const { category, priority, status, sort = 'newest' } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  filter.status = status || 'Pending';

  let sortSpec = { createdAt: -1 };
  if (sort === 'oldest') sortSpec = { createdAt: 1 };
  if (sort === 'priority') sortSpec = { priorityScore: -1, createdAt: -1 };

  const requests = await HelpRequest.find(filter)
    .populate('requester', 'fullName verificationStatus ratingAverage neighborhood')
    .sort(sortSpec)
    .limit(100);

  res.json({ success: true, data: requests });
});

/** Personalized recommended-for-you list, ranked by the matching engine. */
const recommendedRequests = asyncHandler(async (req, res) => {
  const openRequests = await HelpRequest.find({ status: 'Pending' })
    .populate('requester', 'fullName verificationStatus')
    .limit(100);

  const scored = openRequests
    .map((request) => {
      const { calculateMatchScore } = require('../services/matchingEngine');
      const result = calculateMatchScore(req.user, request);
      return { request, ...result };
    })
    .filter((r) => r.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  res.json({ success: true, data: scored });
});

const myRequests = asyncHandler(async (req, res) => {
  const requests = await HelpRequest.find({ requester: req.user._id })
    .populate('assignedVolunteer', 'fullName ratingAverage verificationStatus')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: requests });
});

const myAcceptedTasks = asyncHandler(async (req, res) => {
  const requests = await HelpRequest.find({ assignedVolunteer: req.user._id })
    .populate('requester', 'fullName ratingAverage verificationStatus')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: requests });
});

const getRequestById = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id)
    .populate('requester', 'fullName ratingAverage verificationStatus neighborhood')
    .populate('assignedVolunteer', 'fullName ratingAverage verificationStatus volunteerSkills');
  if (!request) throw new ApiError(404, 'Request not found.');

  const isOwner = String(request.requester._id) === String(req.user._id);
  const isVolunteer = request.assignedVolunteer && String(request.assignedVolunteer._id) === String(req.user._id);

  // Live location only visible to the two parties involved
  const data = request.toObject();
  if (!isOwner && !isVolunteer) {
    data.liveLocation = { active: false, lat: null, lng: null, updatedAt: null };
  }

  res.json({ success: true, data });
});

/**
 * Accept a request. Uses an ATOMIC findOneAndUpdate with status:'Pending' in the
 * filter so that if two volunteers click "Accept" at the same moment, only the
 * first write succeeds — the second gets a 409, preventing double-assignment.
 * This is a database-level safeguard, not just a frontend check (requirement #6).
 */
const acceptRequest = asyncHandler(async (req, res) => {
  const now = new Date();
  const updated = await HelpRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'Pending' },
    {
      $set: { status: 'Accepted', assignedVolunteer: req.user._id, acceptedAt: now },
      $push: { statusHistory: { status: 'Accepted', changedAt: now, note: `Accepted by ${req.user.fullName}` } },
    },
    { new: true }
  );

  if (!updated) {
    const existing = await HelpRequest.findById(req.params.id);
    if (!existing) throw new ApiError(404, 'Request not found.');
    throw new ApiError(409, 'This request has already been accepted by another volunteer.');
  }

  if (String(updated.requester) === String(req.user._id)) {
    // Roll back — can't accept your own request. (Rare race; caught here defensively.)
    updated.status = 'Pending';
    updated.assignedVolunteer = null;
    updated.acceptedAt = null;
    await updated.save();
    throw new ApiError(400, 'You cannot accept your own request.');
  }

  await notify({
    user: updated.requester,
    type: 'REQUEST_ACCEPTED',
    message: `${req.user.fullName} accepted your request "${updated.title}".`,
    relatedRequest: updated._id,
  });

  res.json({ success: true, data: updated });
});

/** Update status along the valid lifecycle only; only the assigned volunteer may do this. */
const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const request = await HelpRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found.');

  if (!request.assignedVolunteer || String(request.assignedVolunteer) !== String(req.user._id)) {
    throw new ApiError(403, 'Only the assigned volunteer can update this request\'s status.');
  }

  const allowedNext = VALID_TRANSITIONS[request.status] || [];
  if (!allowedNext.includes(status)) {
    throw new ApiError(400, `Invalid status transition from "${request.status}" to "${status}".`);
  }

  request.status = status;
  request.statusHistory.push({ status, changedAt: new Date(), note: note || '' });

  if (status === 'Completed') {
    request.completedAt = new Date();
    request.liveLocation = { active: false, lat: null, lng: null, updatedAt: null };
    await User.findByIdAndUpdate(request.assignedVolunteer, { $inc: { completedRequestsCount: 1 } });
  }
  if (status === 'Cancelled') {
    request.cancelledAt = new Date();
    request.cancelReason = note || '';
    request.liveLocation = { active: false, lat: null, lng: null, updatedAt: null };
  }

  await request.save();

  await notify({
    user: request.requester,
    type: status === 'Completed' ? 'REQUEST_COMPLETED' : status === 'Cancelled' ? 'REQUEST_CANCELLED' : 'STATUS_UPDATED',
    message: `Your request "${request.title}" is now: ${status}.`,
    relatedRequest: request._id,
  });

  res.json({ success: true, data: request });
});

/** Requester may cancel their own request before completion. */
const cancelRequest = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found.');
  if (String(request.requester) !== String(req.user._id)) {
    throw new ApiError(403, 'Only the requester can cancel this request.');
  }
  if (['Completed', 'Cancelled'].includes(request.status)) {
    throw new ApiError(400, `Request already ${request.status.toLowerCase()}.`);
  }

  request.status = 'Cancelled';
  request.cancelledAt = new Date();
  request.cancelReason = req.body.reason || '';
  request.statusHistory.push({ status: 'Cancelled', changedAt: new Date(), note: request.cancelReason });
  request.liveLocation = { active: false, lat: null, lng: null, updatedAt: null };
  await request.save();

  if (request.assignedVolunteer) {
    await notify({
      user: request.assignedVolunteer,
      type: 'REQUEST_CANCELLED',
      message: `The request "${request.title}" was cancelled by the requester.`,
      relatedRequest: request._id,
    });
  }

  res.json({ success: true, data: request });
});

/** Volunteer opts in to sharing live location for an active, accepted request. */
const startLocationSharing = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  const request = await HelpRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found.');
  if (!request.assignedVolunteer || String(request.assignedVolunteer) !== String(req.user._id)) {
    throw new ApiError(403, 'Only the assigned volunteer can share location for this request.');
  }
  if (!['Accepted', 'On the Way', 'In Progress'].includes(request.status)) {
    throw new ApiError(400, 'Location sharing is only available while the task is active.');
  }

  request.liveLocation = { active: true, lat, lng, updatedAt: new Date() };
  await request.save();
  res.json({ success: true, data: request.liveLocation });
});

const updateLocationPing = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  const request = await HelpRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found.');
  if (!request.liveLocation.active || String(request.assignedVolunteer) !== String(req.user._id)) {
    throw new ApiError(400, 'Location sharing is not active for this volunteer.');
  }
  request.liveLocation.lat = lat;
  request.liveLocation.lng = lng;
  request.liveLocation.updatedAt = new Date();
  await request.save();
  res.json({ success: true, data: request.liveLocation });
});

const stopLocationSharing = asyncHandler(async (req, res) => {
  const request = await HelpRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found.');
  if (String(request.assignedVolunteer) !== String(req.user._id)) {
    throw new ApiError(403, 'Only the assigned volunteer can stop sharing location.');
  }
  request.liveLocation = { active: false, lat: null, lng: null, updatedAt: null };
  await request.save();
  res.json({ success: true, data: request.liveLocation });
});

module.exports = {
  createRequest, browseRequests, recommendedRequests, myRequests, myAcceptedTasks,
  getRequestById, acceptRequest, updateStatus, cancelRequest,
  startLocationSharing, updateLocationPing, stopLocationSharing,
};
