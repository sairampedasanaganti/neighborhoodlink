/**
 * Central place to create notifications. Any future Firebase Cloud Messaging
 * push step should be added inside `notify()` only — controllers never need
 * to change, since they all go through this single function.
 */
const Notification = require('../models/Notification');

async function notify({ user, type, message, relatedRequest = null }) {
  const notification = await Notification.create({ user, type, message, relatedRequest });

  // --- Optional FCM push hook (disabled by default) ---
  // if (process.env.FCM_ENABLED === 'true') {
  //   await sendPushNotification(user, message);
  // }

  return notification;
}

module.exports = { notify };
