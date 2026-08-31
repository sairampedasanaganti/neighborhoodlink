/**
 * User model — application profile data.
 * Passwords are NEVER stored here; authentication is fully delegated to Firebase.
 * `firebaseUid` links this document to the Firebase Authentication account.
 */
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: '' },
    profilePicture: { type: String, default: '' },

    neighborhood: { type: String, trim: true, default: '' },
    location: { type: locationSchema, default: () => ({}) },

    // Volunteer-related fields — every user can act as a volunteer
    volunteerSkills: {
      type: [String],
      default: [],
      enum: [
        'Tutoring',
        'Driving/Transport',
        'Grocery Shopping',
        'Medicine Pickup',
        'Elderly Care',
        'Pet Care',
        'Tech Support',
        'General Help',
      ],
    },
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'Unavailable'],
      default: 'Available',
    },

    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    emailVerified: { type: Boolean, default: false },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    // Aggregate rating fields, recalculated whenever a new Review is created
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },

    completedRequestsCount: { type: Number, default: 0 },

    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.index({ 'location.lat': 1, 'location.lng': 1 });

// Never leak internal fields to the client
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    fullName: this.fullName,
    neighborhood: this.neighborhood,
    profilePicture: this.profilePicture,
    volunteerSkills: this.volunteerSkills,
    availability: this.availability,
    verificationStatus: this.verificationStatus,
    ratingAverage: this.ratingAverage,
    ratingCount: this.ratingCount,
    completedRequestsCount: this.completedRequestsCount,
  };
};

module.exports = mongoose.model('User', userSchema);
