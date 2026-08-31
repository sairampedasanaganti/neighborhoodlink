const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireVerified } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const ctrl = require('../controllers/requestController');
const reviewCtrl = require('../controllers/reviewController');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  requireVerified,
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('category').isIn(require('../models/HelpRequest').CATEGORY_VALUES),
  ],
  validateRequest,
  ctrl.createRequest
);

router.get('/', requireAuth, ctrl.browseRequests);
router.get('/recommended', requireAuth, ctrl.recommendedRequests);
router.get('/mine', requireAuth, ctrl.myRequests);
router.get('/accepted', requireAuth, ctrl.myAcceptedTasks);
router.get('/:id', requireAuth, ctrl.getRequestById);

router.post('/:id/accept', requireAuth, requireVerified, ctrl.acceptRequest);
router.patch('/:id/status', requireAuth, [body('status').notEmpty()], validateRequest, ctrl.updateStatus);
router.post('/:id/cancel', requireAuth, ctrl.cancelRequest);

router.post('/:id/location/start', requireAuth, ctrl.startLocationSharing);
router.patch('/:id/location/ping', requireAuth, ctrl.updateLocationPing);
router.post('/:id/location/stop', requireAuth, ctrl.stopLocationSharing);

router.post(
  '/:id/reviews',
  requireAuth,
  [body('rating').isInt({ min: 1, max: 5 })],
  validateRequest,
  reviewCtrl.createReview
);

module.exports = router;
