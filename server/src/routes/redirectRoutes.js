const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  handleVendorEntry,
  handleSurveyReturn,
  testRedirectFlow
} = require('../controllers/redirectController');

// Public redirect routes - no authentication required
router.get('/v/:vendorUuid', handleVendorEntry);
router.get('/r/:sessionId', handleSurveyReturn);

// Test route - requires authentication
router.get('/api/redirect/test/:vendorUuid', protect, testRedirectFlow);

module.exports = router;