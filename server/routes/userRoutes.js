const express = require('express');
const { body } = require('express-validator');
const { requireAuth, requireFirebaseAuth } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const ctrl = require('../controllers/userController');

const router = express.Router();

router.post(
  '/register',
  requireFirebaseAuth,
  [body('fullName').trim().notEmpty().withMessage('Full name is required')],
  validateRequest,
  ctrl.registerProfile
);

router.get('/me', requireAuth, ctrl.getMe);
router.patch('/me', requireAuth, ctrl.updateMe);
router.post('/dev-verify-me', requireAuth, ctrl.devVerifyMe);
router.get('/:id', requireAuth, ctrl.getPublicProfile);

module.exports = router;
