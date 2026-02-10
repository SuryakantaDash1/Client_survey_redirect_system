const Session = require('../models/Session');
const Survey = require('../models/Survey');
const Vendor = require('../models/Vendor');

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    // Build filter from query params
    const filter = {};

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by survey
    if (req.query.surveyId) {
      filter.surveyId = req.query.surveyId;
    }

    // Filter by vendor
    if (req.query.vendorId) {
      filter.vendorId = req.query.vendorId;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const sessions = await Session.find(filter)
      .populate('surveyId', 'name')
      .populate('vendorId', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments(filter);

    res.json({
      success: true,
      count: sessions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent sessions
// @route   GET /api/sessions/recent
// @access  Private
exports.getRecentSessions = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const sessions = await Session.find()
      .populate('surveyId', 'name')
      .populate('vendorId', 'name')
      .sort('-createdAt')
      .limit(limit);

    // Format for dashboard - include sessionId for testing
    const formattedSessions = sessions.map(session => ({
      _id: session._id,
      sessionId: session.sessionId, // Include for testing
      surveyName: session.surveyId?.name || 'Unknown Survey',
      vendorName: session.vendorId?.name || 'Unknown Vendor',
      status: session.status,
      createdAt: session.createdAt
    }));

    res.json({
      success: true,
      data: formattedSessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session stats
// @route   GET /api/sessions/stats
// @access  Private
exports.getSessionStats = async (req, res, next) => {
  try {
    const totalSessions = await Session.countDocuments();
    const activeSessions = await Session.countDocuments({ status: 'active' });
    const completedSessions = await Session.countDocuments({ status: 'complete' });
    const quotaFullSessions = await Session.countDocuments({ status: 'quota_full' });
    const terminatedSessions = await Session.countDocuments({ status: 'terminate' });

    // Today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = await Session.countDocuments({
      createdAt: { $gte: today }
    });

    res.json({
      success: true,
      data: {
        totalSessions,
        activeSessions,
        completedSessions,
        quotaFullSessions,
        terminatedSessions,
        todaySessions,
        conversionRate: totalSessions > 0
          ? ((completedSessions / totalSessions) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    next(error);
  }
};