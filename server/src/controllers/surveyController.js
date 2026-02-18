const Survey = require('../models/Survey');
const Vendor = require('../models/Vendor');
const Session = require('../models/Session');

// @desc    Get all surveys
// @route   GET /api/surveys
// @access  Private
exports.getSurveys = async (req, res, next) => {
  try {
    const surveys = await Survey.find()
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single survey
// @route   GET /api/surveys/:id
// @access  Private
exports.getSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('vendors');

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create survey
// @route   POST /api/surveys
// @access  Private
exports.createSurvey = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;

    const survey = await Survey.create(req.body);

    res.status(201).json({
      success: true,
      data: survey
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update survey
// @route   PUT /api/surveys/:id
// @access  Private
exports.updateSurvey = async (req, res, next) => {
  try {
    // Don't allow updating surveySlug
    delete req.body.surveySlug;

    // Use find + save to trigger pre-save hook
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Apply updates
    if (req.body.name !== undefined) survey.name = req.body.name;
    if (req.body.description !== undefined) survey.description = req.body.description;
    if (req.body.clientUrl !== undefined) survey.clientUrl = req.body.clientUrl;
    if (req.body.isActive !== undefined) survey.isActive = req.body.isActive;
    if (req.body.completePageMessage !== undefined) survey.completePageMessage = req.body.completePageMessage;
    if (req.body.terminatePageMessage !== undefined) survey.terminatePageMessage = req.body.terminatePageMessage;
    if (req.body.quotaFullPageMessage !== undefined) survey.quotaFullPageMessage = req.body.quotaFullPageMessage;
    if (req.body.securityTermPageMessage !== undefined) survey.securityTermPageMessage = req.body.securityTermPageMessage;

    await survey.save();

    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete survey
// @route   DELETE /api/surveys/:id
// @access  Private
exports.deleteSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Delete all vendors associated with this survey
    await Vendor.deleteMany({ surveyId: survey._id });

    // Delete all sessions associated with this survey
    await Session.deleteMany({ surveyId: survey._id });

    await survey.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get survey status page URLs
// @route   GET /api/surveys/:id/status-urls
// @access  Private
exports.getStatusUrls = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const urls = survey.getStatusPageUrls(baseUrl);

    res.json({
      success: true,
      data: urls
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get survey statistics
// @route   GET /api/surveys/:id/stats
// @access  Private
exports.getSurveyStats = async (req, res, next) => {
  try {
    const surveyId = req.params.id;

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const vendors = await Vendor.find({ surveyId });
    const sessions = await Session.find({ surveyId });

    const stats = {
      totalVendors: vendors.length,
      activeVendors: vendors.filter(v => v.isActive).length,
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedSessions: sessions.filter(s => s.status === 'complete').length,
      quotaFullSessions: sessions.filter(s => s.status === 'quota_full').length,
      terminatedSessions: sessions.filter(s => s.status === 'terminate').length,
      avgSessionDuration: sessions
        .filter(s => s.duration)
        .reduce((acc, s) => acc + s.duration, 0) / sessions.filter(s => s.duration).length || 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};