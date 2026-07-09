const express = require('express');
const router = express.Router();
const statusPageController = require('../controllers/statusPageController');
const newRedirectController = require('../controllers/newRedirectController');
const screenerController = require('../controllers/screenerController');

// Public status pages: /:surveySlug/:status
router.get('/:surveySlug/complete', statusPageController.showStatusPage);
router.get('/:surveySlug/terminate', statusPageController.showStatusPage);
router.get('/:surveySlug/quotafull', statusPageController.showStatusPage);
router.get('/:surveySlug/security', statusPageController.showStatusPage);

// Vendor entry: /r/:surveySlug/:vendorSlug  OR  /r/:surveySlug/:vendorSlug/:urlSlug
router.get('/r/:surveySlug/:vendorSlug/:urlSlug', newRedirectController.handleVendorEntry);
router.get('/r/:surveySlug/:vendorSlug', newRedirectController.handleVendorEntry);

// Screener questionnaire: /screen/:trackingId
router.get('/screen/:trackingId', screenerController.showScreener);
router.post('/screen/:trackingId/submit', screenerController.submitScreener);

// Exit callback: /exit/:surveySlug
router.get('/exit/:surveySlug', newRedirectController.handleSurveyExit);

module.exports = router;
