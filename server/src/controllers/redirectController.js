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

    // Validate survey URL
    if (!survey.clientUrl.startsWith('http://') && !survey.clientUrl.startsWith('https://')) {
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Configuration Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
              padding: 20px;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 600px;
              text-align: center;
            }
            h1 {
              color: #e74c3c;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              line-height: 1.6;
              margin-bottom: 20px;
            }
            code {
              background: #f5f5f5;
              padding: 2px 8px;
              border-radius: 4px;
              font-family: monospace;
              color: #e74c3c;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ Survey Configuration Error</h1>
            <p>The survey URL is not properly configured. The client survey URL must start with <code>http://</code> or <code>https://</code></p>
            <p><strong>Current URL:</strong> <code>${survey.clientUrl}</code></p>
            <p>Please contact the administrator to fix this configuration issue.</p>
          </div>
        </body>
        </html>
      `);
    }

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

    // Find survey to get thank you page messages
    const survey = await Survey.findById(session.surveyId);
    if (!survey) {
      return res.status(404).send('Survey not found');
    }

    // Determine status and URLs based on status parameter
    let redirectUrl;
    let thankYouMessage;
    let pageTitle;
    const normalizedStatus = status.toLowerCase();

    switch (normalizedStatus) {
      case 'complete':
      case '1':
        redirectUrl = vendor.completeUrl;
        session.status = 'complete';
        vendor.completedSessions += 1;
        survey.completedSessions += 1;
        thankYouMessage = survey.completePageMessage;
        pageTitle = 'Complete';
        break;
      case 'quota_full':
      case 'quotafull':
      case '3':
        redirectUrl = vendor.quotaFullUrl;
        session.status = 'quota_full';
        vendor.quotaFullSessions += 1;
        survey.quotaFullSessions += 1;
        thankYouMessage = survey.quotaFullPageMessage;
        pageTitle = 'Quota Full';
        break;
      case 'security':
      case 'security_term':
      case '4':
        redirectUrl = vendor.securityTermUrl || vendor.terminateUrl;
        session.status = 'terminate';
        vendor.terminatedSessions += 1;
        survey.terminatedSessions += 1;
        thankYouMessage = survey.securityTermPageMessage;
        pageTitle = 'Security Term';
        break;
      case 'terminate':
      case 'terminated':
      case '2':
      default:
        redirectUrl = vendor.terminateUrl;
        session.status = 'terminate';
        vendor.terminatedSessions += 1;
        survey.terminatedSessions += 1;
        thankYouMessage = survey.terminatePageMessage;
        pageTitle = 'Terminate';
        break;
    }

    // Update session
    session.exitTime = new Date();
    await session.save();

    // Update vendor stats
    await vendor.save();

    // Update survey stats
    await survey.save();

    // Log analytics
    await logAnalytics('exit', session, session.status);

    // Build final vendor redirect URL with query parameters
    const finalUrl = buildUrlWithParams(redirectUrl, Object.fromEntries(session.queryParams));

    // Log response time
    console.log(`Survey return redirect completed in ${Date.now() - startTime}ms`);

    // Return HTML thank you page with auto-redirect to vendor
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pageTitle} - ${survey.name}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 28px;
          }
          p {
            color: #666;
            line-height: 1.6;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .redirect-info {
            color: #999;
            font-size: 14px;
            margin-top: 20px;
          }
          .vendor-links {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          .vendor-links p {
            font-size: 14px;
            color: #999;
            margin-bottom: 10px;
          }
          .vendor-links a {
            color: #667eea;
            text-decoration: none;
            word-break: break-all;
            font-size: 13px;
          }
        </style>
        <script>
          // Auto-redirect to vendor URL after 3 seconds
          setTimeout(function() {
            window.location.href = '${finalUrl}';
          }, 3000);
        </script>
      </head>
      <body>
        <div class="container">
          <h1>${pageTitle} - ${survey.name}</h1>
          <p>${thankYouMessage}</p>
          <div class="redirect-info">
            Redirecting you back in 3 seconds...
          </div>
          <div class="vendor-links">
            <p>Vendor Links:</p>
            <p><strong>A:</strong> <a href="${vendor.completeUrl}">${vendor.completeUrl}</a></p>
            <p><strong>B:</strong> <a href="${vendor.terminateUrl}">${vendor.terminateUrl}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
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