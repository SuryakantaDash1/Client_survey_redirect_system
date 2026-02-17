const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyStats,
  getStatusUrls
} = require('../controllers/surveyController');
const {
  getVendors,
  createVendor
} = require('../controllers/vendorController');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getSurveys)
  .post(authorize('admin'), createSurvey);

router.route('/:id')
  .get(getSurvey)
  .put(authorize('admin'), updateSurvey)
  .delete(authorize('admin'), deleteSurvey);

router.get('/:id/stats', getSurveyStats);
router.get('/:id/status-urls', getStatusUrls);

// Vendor routes under surveys
router.route('/:surveyId/vendors')
  .get(getVendors)
  .post(authorize('admin'), createVendor);

module.exports = router;