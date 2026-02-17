const express = require('express');
const router = express.Router();
const statusPageController = require('../controllers/statusPageController');
const newRedirectController = require('../controllers/newRedirectController');

// Public status pages: /:surveySlug/:status
router.get('/:surveySlug/complete', statusPageController.showStatusPage);
router.get('/:surveySlug/terminate', statusPageController.showStatusPage);
router.get('/:surveySlug/quotafull', statusPageController.showStatusPage);
router.get('/:surveySlug/security', statusPageController.showStatusPage);

// Vendor entry: /r/:surveySlug/:vendorSlug
router.get('/r/:surveySlug/:vendorSlug', newRedirectController.handleVendorEntry);

// Exit callback: /exit/:surveySlug
router.get('/exit/:surveySlug', newRedirectController.handleSurveyExit);

module.exports = router;
