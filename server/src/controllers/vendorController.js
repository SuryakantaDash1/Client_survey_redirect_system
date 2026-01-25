const Vendor = require('../models/Vendor');
const Survey = require('../models/Survey');
const Session = require('../models/Session');

// @desc    Get vendors for a survey
// @route   GET /api/surveys/:surveyId/vendors
// @access  Private
exports.getVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find({ surveyId: req.params.surveyId });

    res.json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Private
exports.getVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('surveyId', 'name');

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create vendor for survey
// @route   POST /api/surveys/:surveyId/vendors
// @access  Private
exports.createVendor = async (req, res, next) => {
  try {
    req.body.surveyId = req.params.surveyId;

    // Check if survey exists
    const survey = await Survey.findById(req.params.surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const vendor = await Vendor.create(req.body);

    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private
exports.updateVendor = async (req, res, next) => {
  try {
    // Don't allow updating vendorUuid
    delete req.body.vendorUuid;

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private
exports.deleteVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Delete all sessions associated with this vendor
    await Session.deleteMany({ vendorId: vendor._id });

    await vendor.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor entry URL
// @route   GET /api/vendors/:id/url
// @access  Private
exports.getVendorUrl = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const entryUrl = vendor.getEntryUrl(process.env.BASE_URL);

    res.json({
      success: true,
      data: {
        vendorName: vendor.name,
        entryUrl,
        vendorUuid: vendor.vendorUuid
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor statistics
// @route   GET /api/vendors/:id/stats
// @access  Private
exports.getVendorStats = async (req, res, next) => {
  try {
    const vendorId = req.params.id;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const sessions = await Session.find({ vendorId });

    const stats = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedSessions: sessions.filter(s => s.status === 'complete').length,
      quotaFullSessions: sessions.filter(s => s.status === 'quota_full').length,
      terminatedSessions: sessions.filter(s => s.status === 'terminate').length,
      avgSessionDuration: sessions
        .filter(s => s.duration)
        .reduce((acc, s) => acc + s.duration, 0) / sessions.filter(s => s.duration).length || 0,
      conversionRate: sessions.length > 0
        ? (sessions.filter(s => s.status === 'complete').length / sessions.length * 100).toFixed(2)
        : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};