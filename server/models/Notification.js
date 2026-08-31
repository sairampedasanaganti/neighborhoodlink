/**
 * Notification model — in-app notifications.
 * Designed so an FCM push step can later be added inside services/notificationService.js
 * without changing this schema or any controller.
 */
const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'NEW_MATCHING_REQUEST',
  'REQUEST_ACCEPTED',
  'STATUS_UPDATED',
  'REQUEST_COMPLETED',
  'REQUEST_CANCELLED',
  'REQUEST_WAITING_TOO_LONG',
  'VERIFICATION_APPROVED',
  'VERIFICATION_REJECTED',
  'NEW_REVIEW',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true },
    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'HelpRequest', default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.statics.TYPES = NOTIFICATION_TYPES;

module.exports = mongoose.model('Notification', notificationSchema);
