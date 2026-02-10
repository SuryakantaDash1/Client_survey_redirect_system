const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSessions,
  getRecentSessions,
  getSessionStats
} = require('../controllers/sessionController');

// All routes require authentication
router.use(protect);

router.get('/', getSessions);
router.get('/recent', getRecentSessions);
router.get('/stats', getSessionStats);

module.exports = router;