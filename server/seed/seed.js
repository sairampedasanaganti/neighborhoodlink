/**
 * Seeds MongoDB with realistic demo data: users, requests, notifications, reviews.
 * NOTE: this creates MongoDB profile documents only. To actually log in as these
 * users you must also create matching accounts in Firebase Authentication (or
 * adjust firebaseUid values here to match Firebase test users you create manually).
 * Run: npm run seed  (from /server)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const HelpRequest = require('../models/HelpRequest');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const { calculatePriority } = require('../services/priorityEngine');

async function seed() {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    HelpRequest.deleteMany({}),
    Notification.deleteMany({}),
    Review.deleteMany({}),
  ]);

  console.log('[Seed] Creating users...');
  const users = await User.insertMany([
    {
      firebaseUid: 'demo-admin-uid',
      fullName: 'Asha Admin',
      email: 'admin@neighborlink.demo',
      phone: '9000000001',
      neighborhood: 'Fairview Heights',
      location: { address: 'Fairview Heights', lat: 12.9716, lng: 77.5946 },
      role: 'admin',
      verificationStatus: 'Verified',
      emailVerified: true,
      availability: 'Available',
    },
    {
      firebaseUid: 'demo-requester-uid',
      fullName: 'Rahul Requester',
      email: 'rahul@neighborlink.demo',
      phone: '9000000002',
      neighborhood: 'Fairview Heights',
      location: { address: 'Fairview Heights', lat: 12.9720, lng: 77.5950 },
      verificationStatus: 'Verified',
      emailVerified: true,
      volunteerSkills: ['General Help'],
      availability: 'Available',
    },
    {
      firebaseUid: 'demo-volunteer1-uid',
      fullName: 'Vikram Volunteer',
      email: 'vikram@neighborlink.demo',
      phone: '9000000003',
      neighborhood: 'Fairview Heights',
      location: { address: 'Fairview Heights', lat: 12.9725, lng: 77.5940 },
      verificationStatus: 'Verified',
      emailVerified: true,
      volunteerSkills: ['Driving/Transport', 'Medicine Pickup', 'Grocery Shopping'],
      availability: 'Available',
      ratingAverage: 4.7,
      ratingCount: 12,
      completedRequestsCount: 12,
    },
    {
      firebaseUid: 'demo-volunteer2-uid',
      fullName: 'Priya Patel',
      email: 'priya@neighborlink.demo',
      phone: '9000000004',
      neighborhood: 'Lakeside',
      location: { address: 'Lakeside', lat: 13.01, lng: 77.62 },
      verificationStatus: 'Verified',
      emailVerified: true,
      volunteerSkills: ['Tutoring', 'Tech Support'],
      availability: 'Available',
      ratingAverage: 4.9,
      ratingCount: 20,
      completedRequestsCount: 20,
    },
    {
      firebaseUid: 'demo-pending-uid',
      fullName: 'Neha New',
      email: 'neha@neighborlink.demo',
      phone: '9000000005',
      neighborhood: 'Fairview Heights',
      location: { address: 'Fairview Heights', lat: 12.973, lng: 77.594 },
      verificationStatus: 'Pending',
      emailVerified: true,
      volunteerSkills: ['General Help'],
    },
  ]);

  const [admin, requester, vikram, priya] = users;

  console.log('[Seed] Creating help requests...');
  const reqDefs = [
    {
      requester: requester._id,
      title: 'Need medicine picked up from Apollo Pharmacy',
      description: 'My mother needs her BP medicine urgently, cannot leave home. Fairly urgent.',
      category: 'Medicine Pickup',
      requesterUrgency: 'HIGH',
      location: { address: 'Fairview Heights Main Rd', lat: 12.9718, lng: 77.5948 },
    },
    {
      requester: requester._id,
      title: 'Weekly grocery pickup',
      description: 'Regular grocery list from the local supermarket, no rush.',
      category: 'Grocery Pickup',
      requesterUrgency: 'LOW',
      location: { address: 'Fairview Heights Main Rd', lat: 12.9718, lng: 77.5948 },
    },
    {
      requester: requester._id,
      title: 'Math tutoring for 10th grade exam prep',
      description: 'Looking for someone to help my son with algebra twice a week.',
      category: 'Tutoring',
      requesterUrgency: 'MEDIUM',
      requiredSkill: 'Tutoring',
      location: { address: 'Fairview Heights', lat: 12.9722, lng: 77.5951 },
    },
    {
      requester: requester._id,
      title: 'Emergency transport to hospital',
      description: 'Neighbor fainted, need urgent transport, ambulance is delayed.',
      category: 'Emergency Transport',
      requesterUrgency: 'HIGH',
      location: { address: 'Fairview Heights', lat: 12.9715, lng: 77.5944 },
    },
  ];

  const created = [];
  for (const def of reqDefs) {
    const { score, priority, explanation } = calculatePriority({
      category: def.category, requesterUrgency: def.requesterUrgency, description: def.description,
    });
    created.push(
      await HelpRequest.create({ ...def, priority, priorityScore: score, priorityExplanation: explanation })
    );
  }

  // Mark one as completed, with a review, to demo the rating flow
  const completedReq = created[1];
  completedReq.status = 'Completed';
  completedReq.assignedVolunteer = vikram._id;
  completedReq.acceptedAt = new Date(Date.now() - 3600 * 1000);
  completedReq.completedAt = new Date();
  completedReq.statusHistory.push(
    { status: 'Accepted', changedAt: new Date(Date.now() - 3500 * 1000) },
    { status: 'On the Way', changedAt: new Date(Date.now() - 3000 * 1000) },
    { status: 'In Progress', changedAt: new Date(Date.now() - 1800 * 1000) },
    { status: 'Completed', changedAt: new Date() }
  );
  completedReq.requesterReviewed = true;
  await completedReq.save();

  await Review.create({
    request: completedReq._id,
    reviewer: requester._id,
    reviewee: vikram._id,
    rating: 5,
    comment: 'Very prompt and friendly, thank you!',
    role: 'requester_to_volunteer',
  });

  console.log('[Seed] Creating notifications...');
  await Notification.insertMany([
    {
      user: requester._id, type: 'REQUEST_COMPLETED',
      message: `Your request "${completedReq.title}" is now: Completed.`,
      relatedRequest: completedReq._id,
    },
    {
      user: vikram._id, type: 'NEW_MATCHING_REQUEST',
      message: `New Emergency Transport request near you: "${created[3].title}" (HIGH priority)`,
      relatedRequest: created[3]._id,
    },
    { user: priya._id, type: 'NEW_MATCHING_REQUEST', message: `New Tutoring request near you: "${created[2].title}" (MEDIUM priority)`, relatedRequest: created[2]._id },
  ]);

  console.log('[Seed] Done.');
  console.log('\nDemo accounts (create matching Firebase users or use Quick Login to log in):');
  users.forEach((u) => console.log(`  - ${u.email}  (role: ${u.role}, status: ${u.verificationStatus})`));

  return { users, requests: created };
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seed();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('[Seed] Failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = { seedDatabase: seed };
