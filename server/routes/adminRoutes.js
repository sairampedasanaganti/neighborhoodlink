const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const ctrl = require('../controllers/adminController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/users', ctrl.listUsers);
router.get('/users/pending', ctrl.pendingUsers);
router.patch('/users/:id/verification', [body('status').isIn(['Verified', 'Rejected'])], validateRequest, ctrl.setVerificationStatus);
router.patch('/users/:id/suspend', ctrl.suspendUser);
router.get('/requests', ctrl.allRequests);
router.get('/stats', ctrl.stats);

module.exports = router;
