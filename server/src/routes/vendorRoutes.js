const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorUrl,
  getVendorStats
} = require('../controllers/vendorController');

// All routes require authentication
router.use(protect);

// Survey-specific vendor routes (moved to survey context)
// These routes will be accessed as /api/surveys/:surveyId/vendors

// Vendor-specific routes
router.route('/vendors/:id')
  .get(getVendor)
  .put(authorize('admin'), updateVendor)
  .delete(authorize('admin'), deleteVendor);

router.get('/vendors/:id/url', getVendorUrl);
router.get('/vendors/:id/stats', getVendorStats);

module.exports = router;