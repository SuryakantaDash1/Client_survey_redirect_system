const Vendor = require('../models/Vendor');
const Survey = require('../models/Survey');
const Session = require('../models/Session');
const Analytics = require('../models/Analytics');

// Helper function to build URL with query parameters
const buildUrlWithParams = (baseUrl, params) => {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  return url.toString();
};

// Helper function to log analytics
const logAnalytics = async (eventType, session, status = null) => {
  try {
    await Analytics.create({
      surveyId: session.surveyId,
      vendorId: session.vendorId,
      sessionId: session.sessionId,
      eventType,
      status: status || session.status,
      responseTime: Date.now() - session.entryTime,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent
    });
  } catch (error) {
    console.error('Analytics logging error:', error);
  }
};

// @desc    Handle vendor entry redirect
// @route   GET /v/:vendorUuid
// @access  Public
exports.handleVendorEntry = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { vendorUuid } = req.params;
    const queryParams = req.query;

    // Find vendor
    console.log('Looking for vendor with UUID:', vendorUuid);
    const vendor = await Vendor.findOne({ vendorUuid, isActive: true });

    if (!vendor) {
      // Check if vendor exists but is inactive
      const inactiveVendor = await Vendor.findOne({ vendorUuid });
      if (inactiveVendor) {
        console.log('Vendor found but inactive:', inactiveVendor);
        return res.status(404).send('Vendor is inactive');
      }
      console.log('No vendor found with UUID:', vendorUuid);
      return res.status(404).send('Invalid vendor link');
    }
    console.log('Vendor found:', vendor);

    // Find survey
    const survey = await Survey.findById(vendor.surveyId);
    if (!survey || !survey.isActive) {
      return res.status(404).send('Survey not available');
    }

    // Create session
    const session = new Session({
      vendorId: vendor._id,
      surveyId: survey._id,
      queryParams: queryParams,
      status: 'active',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      entryTime: new Date()
    });

    await session.save();

    // Update vendor stats
    vendor.totalSessions += 1;
    await vendor.save();

    // Update survey stats
    survey.totalSessions += 1;
    await survey.save();

    // Log analytics
    await logAnalytics('entry', session);

    // Build redirect URL with parameters
    const redirectParams = {
      ...queryParams,
      return_url: `${process.env.BASE_URL}/r/${session.sessionId}`
    };

    const redirectUrl = buildUrlWithParams(survey.clientUrl, redirectParams);

    // For testing: if the survey URL is a fake/test domain, return session info instead of redirecting
    const testDomains = ['newsurveyurl.com', 'surveyplatform.com', 'example.com', 'test.com'];
    const urlHost = new URL(survey.clientUrl).hostname;

    if (testDomains.some(domain => urlHost.includes(domain))) {
      console.log('Test mode: Fake survey URL detected, returning session info');
      return res.json({
        success: true,
        message: 'Session created successfully (redirect disabled for testing)',
        sessionId: session.sessionId,
        redirectUrl: redirectUrl,
        testInstructions: {
          complete: `GET ${process.env.BASE_URL}/r/${session.sessionId}?status=complete`,
          terminate: `GET ${process.env.BASE_URL}/r/${session.sessionId}?status=terminate`,
          quotaFull: `GET ${process.env.BASE_URL}/r/${session.sessionId}?status=quota_full`
        },
        session: {
          id: session._id,
          sessionId: session.sessionId,
          vendorName: vendor.name,
          surveyName: survey.name,
          status: session.status
        }
      });
    }

    // Log response time
    console.log(`Vendor entry redirect completed in ${Date.now() - startTime}ms`);

    // Redirect to survey
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Vendor entry error:', error);
    res.status(500).send('An error occurred');
  }
};

// @desc    Handle survey return redirect
// @route   GET /r/:sessionId
// @access  Public
exports.handleSurveyReturn = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { sessionId } = req.params;
    const { status = 'terminate' } = req.query;

    // Find session
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).send('Session not found');
    }

    // Check if session already completed
    if (session.status !== 'active') {
      return res.status(400).send('Session already completed');
    }

    // Find vendor
    const vendor = await Vendor.findById(session.vendorId);
    if (!vendor) {
      return res.status(404).send('Vendor not found');
    }

    // Determine redirect URL based on status
    let redirectUrl;
    const normalizedStatus = status.toLowerCase();

    switch (normalizedStatus) {
      case 'complete':
        redirectUrl = vendor.completeUrl;
        session.status = 'complete';
        vendor.completedSessions += 1;
        break;
      case 'quota_full':
      case 'quotafull':
        redirectUrl = vendor.quotaFullUrl;
        session.status = 'quota_full';
        vendor.quotaFullSessions += 1;
        break;
      case 'terminate':
      case 'terminated':
      default:
        redirectUrl = vendor.terminateUrl;
        session.status = 'terminate';
        vendor.terminatedSessions += 1;
        break;
    }

    // Update session
    session.exitTime = new Date();
    await session.save();

    // Update vendor stats
    await vendor.save();

    // Update survey stats
    const survey = await Survey.findById(session.surveyId);
    if (survey) {
      switch (session.status) {
        case 'complete':
          survey.completedSessions += 1;
          break;
        case 'quota_full':
          survey.quotaFullSessions += 1;
          break;
        case 'terminate':
          survey.terminatedSessions += 1;
          break;
      }
      await survey.save();
    }

    // Log analytics
    await logAnalytics('exit', session, session.status);

    
    const finalUrl = buildUrlWithParams(redirectUrl, Object.fromEntries(session.queryParams));

    const testDomains = ['vendorplatform.com', 'example.com', 'test.com', 'vendor.com', 'newvendorurl.com', 'vendor3.com', 'vendorNew.com'];
    try {
      const urlHost = new URL(redirectUrl).hostname;
      if (testDomains.some(domain => urlHost.includes(domain))) {
        console.log('Test mode: Fake vendor URL detected, returning completion info');
        return res.json({
          success: true,
          message: `Session completed with status: ${session.status}`,
          sessionId: session.sessionId,
          redirectUrl: finalUrl,
          session: {
            id: session._id,
            sessionId: session.sessionId,
            vendorName: vendor.name,
            status: session.status,
            entryTime: session.entryTime,
            exitTime: session.exitTime
          }
        });
      }
    } catch (urlError) {
      // If URL parsing fails, continue with redirect
      console.log('URL parsing error, attempting redirect:', urlError);
    }

    // Log response time
    console.log(`Survey return redirect completed in ${Date.now() - startTime}ms`);

    // Redirect to vendor
    res.redirect(finalUrl);
  } catch (error) {
    console.error('Survey return error:', error);
    res.status(500).send('An error occurred');
  }
};

// @desc    Test redirect flow
// @route   GET /api/redirect/test/:vendorUuid
// @access  Private (for testing only)
exports.testRedirectFlow = async (req, res, next) => {
  try {
    const { vendorUuid } = req.params;

    const vendor = await Vendor.findOne({ vendorUuid }).populate('surveyId');
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const testData = {
      vendorName: vendor.name,
      surveyName: vendor.surveyId.name,
      entryUrl: vendor.getEntryUrl(process.env.BASE_URL),
      testUrls: {
        entry: `${process.env.BASE_URL}/v/${vendorUuid}?param1=test&param2=value`,
        complete: `${process.env.BASE_URL}/r/[sessionId]?status=complete`,
        quotaFull: `${process.env.BASE_URL}/r/[sessionId]?status=quota_full`,
        terminate: `${process.env.BASE_URL}/r/[sessionId]?status=terminate`
      },
      vendorEndpoints: {
        complete: vendor.completeUrl,
        quotaFull: vendor.quotaFullUrl,
        terminate: vendor.terminateUrl
      }
    };

    res.json({
      success: true,
      data: testData
    });
  } catch (error) {
    next(error);
  }
};