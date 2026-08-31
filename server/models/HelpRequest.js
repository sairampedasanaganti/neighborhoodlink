/**
 * HelpRequest model — the core entity of NeighborLink.
 * Tracks the full lifecycle: Pending -> Accepted -> On the Way -> In Progress -> Completed
 * (or Cancelled at any point before Completed).
 */
const mongoose = require('mongoose');

const STATUS_VALUES = ['Pending', 'Accepted', 'On the Way', 'In Progress', 'Completed', 'Cancelled'];
const CATEGORY_VALUES = ['Grocery Pickup', 'Medicine Pickup', 'Tutoring', 'Emergency Transport', 'Other Community Help'];
const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH'];

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUS_VALUES, required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const liveLocationSchema = new mongoose.Schema(
  {
    active: { type: Boolean, default: false },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    updatedAt: { type: Date, default: null },
  },
  { _id: false }
);

const helpRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    category: { type: String, enum: CATEGORY_VALUES, required: true, index: true },

    location: {
      address: { type: String, trim: true, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // Raw urgency selected by the requester — NOT trusted directly,
    // it is only one input into the computed priority score.
    requesterUrgency: { type: String, enum: PRIORITY_VALUES, default: 'MEDIUM' },

    // Final computed priority — see services/priorityEngine.js
    priority: { type: String, enum: PRIORITY_VALUES, default: 'LOW', index: true },
    priorityScore: { type: Number, default: 0 },
    priorityExplanation: { type: [String], default: [] },

    requiredSkill: { type: String, default: '' },

    status: { type: String, enum: STATUS_VALUES, default: 'Pending', index: true },
    statusHistory: {
      type: [statusHistoryEntrySchema],
      default: () => [{ status: 'Pending', changedAt: new Date(), note: 'Request created' }],
    },

    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    acceptedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },

    liveLocation: { type: liveLocationSchema, default: () => ({}) },

    requesterReviewed: { type: Boolean, default: false }, // requester rated the volunteer
    volunteerReviewed: { type: Boolean, default: false }, // volunteer rated the requester
  },
  { timestamps: true }
);

helpRequestSchema.index({ status: 1, category: 1, priority: -1, createdAt: -1 });

helpRequestSchema.statics.STATUS_VALUES = STATUS_VALUES;
helpRequestSchema.statics.CATEGORY_VALUES = CATEGORY_VALUES;
helpRequestSchema.statics.PRIORITY_VALUES = PRIORITY_VALUES;

module.exports = mongoose.model('HelpRequest', helpRequestSchema);
