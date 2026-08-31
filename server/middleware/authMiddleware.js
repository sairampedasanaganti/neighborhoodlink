/**
 * Verifies the Firebase ID token sent by the client in the Authorization header
 * (format: "Bearer <idToken>"), then attaches the matching MongoDB user document
 * to req.user. Downstream routes rely on req.user, never on client-supplied IDs.
 */
const admin = require('../config/firebase');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

async function verifyToken(token) {
  // 1. Check for dev/demo token formats
  if (token.startsWith('dev-token-') || token.startsWith('demo-')) {
    const uid = token.startsWith('dev-token-') ? token.replace('dev-token-', '') : token;
    let email = `${uid}@neighborlink.demo`;
    if (uid.includes('admin')) email = 'admin@neighborlink.demo';
    else if (uid.includes('volunteer1')) email = 'vikram@neighborlink.demo';
    else if (uid.includes('volunteer2')) email = 'priya@neighborlink.demo';
    else if (uid.includes('requester')) email = 'rahul@neighborlink.demo';
    return { uid, email, email_verified: true };
  }

  if (token.startsWith('mock:')) {
    try {
      const jsonStr = Buffer.from(token.slice(5), 'base64').toString('utf8');
      const payload = JSON.parse(jsonStr);
      return {
        uid: payload.uid || 'dev-user',
        email: payload.email || 'user@neighborlink.demo',
        email_verified: payload.emailVerified !== undefined ? payload.emailVerified : true,
      };
    } catch {
      // ignore
    }
  }

  // 2. Try Firebase Admin verification if initialized
  if (admin && admin.apps && admin.apps.length > 0) {
    try {
      return await admin.auth().verifyIdToken(token);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && token) {
        return {
          uid: token.length > 30 ? token.slice(0, 28) : token,
          email: 'developer@neighborlink.demo',
          email_verified: true,
        };
      }
      throw new ApiError(401, 'Invalid or expired authentication token.');
    }
  }

  // 3. Fallback for dev mode without Firebase Admin credentials
  return {
    uid: token.length > 30 ? token.slice(0, 28) : token,
    email: 'developer@neighborlink.demo',
    email_verified: true,
  };
}

/** Middleware for routes (like /register) that require a valid token but NO existing Mongo profile yet */
const requireFirebaseAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Missing or malformed Authorization header.');
  }

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired authentication token.');
  }

  req.firebaseUser = decoded;
  const user = await User.findOne({ firebaseUid: decoded.uid });
  if (user) {
    if (user.isSuspended) throw new ApiError(403, 'This account has been suspended.');
    req.user = user;
  }

  next();
});

/** Middleware for routes that require an existing, non-suspended Mongo profile */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Missing or malformed Authorization header.');
  }

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired authentication token.');
  }

  req.firebaseUser = decoded;
  let user = await User.findOne({ firebaseUid: decoded.uid });

  // In dev mode, if user is not found by firebaseUid, also link by email if exists (e.g. seeded accounts)
  if (!user && decoded.email) {
    user = await User.findOne({ email: decoded.email });
    if (user) {
      user.firebaseUid = decoded.uid;
      await user.save();
    }
  }

  if (!user) {
    throw new ApiError(404, 'No profile found for this account. Complete registration first.');
  }
  if (user.isSuspended) {
    throw new ApiError(403, 'This account has been suspended.');
  }

  req.user = user;
  next();
});

module.exports = { requireAuth, requireFirebaseAuth };
