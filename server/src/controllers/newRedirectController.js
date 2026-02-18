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

// @desc    Handle vendor entry redirect (NEW STRUCTURE)
// @route   GET /r/:surveySlug/:vendorSlug
// @access  Public
exports.handleVendorEntry = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { surveySlug, vendorSlug } = req.params;
    const queryParams = req.query;

    console.log('Entry request:', { surveySlug, vendorSlug, queryParams });

    // Find survey by slug
    const survey = await Survey.findOne({ surveySlug, isActive: true });
    if (!survey) {
      return res.status(404).send('Survey not found or inactive');
    }

    // Find vendor by slug within this survey
    const vendor = await Vendor.findOne({
      surveyId: survey._id,
      vendorSlug,
      isActive: true
    });

    if (!vendor) {
      return res.status(404).send('Vendor not found or inactive');
    }

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
            h1 { color: #e74c3c; }
            p { color: #666; line-height: 1.6; }
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
            <p>The survey URL is not properly configured. Please contact the administrator.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Create session with tracking ID
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

    console.log('Session created:', {
      sessionId: session.sessionId,
      trackingId: session.trackingId,
      vendor: vendor.name,
      survey: survey.name
    });

    // Build redirect URL with tracking_id
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const redirectParams = {
      ...queryParams,
      tracking_id: session.trackingId,
      return_url: `${baseUrl}/exit/${survey.surveySlug}`
    };

    const redirectUrl = buildUrlWithParams(survey.clientUrl, redirectParams);

    console.log(`Entry redirect completed in ${Date.now() - startTime}ms`);

    // Redirect to survey
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Vendor entry error:', error);
    res.status(500).send('An error occurred');
  }
};

// @desc    Handle survey exit callback (NEW STRUCTURE)
// @route   GET /exit/:surveySlug
// @access  Public
exports.handleSurveyExit = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { surveySlug } = req.params;
    const { status = '2', tracking_id, ...otherParams } = req.query;

    console.log('Exit request:', { surveySlug, status, tracking_id });

    // Find survey by slug
    const survey = await Survey.findOne({ surveySlug });
    if (!survey) {
      return res.status(404).send('Survey not found');
    }

    // Find session by tracking_id
    const session = await Session.findOne({ trackingId: tracking_id });
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

    // Determine status and URLs
    let redirectUrl, thankYouMessage, pageTitle, statusPageUrl;
    const normalizedStatus = status.toString().toLowerCase();

    switch (normalizedStatus) {
      case 'complete':
      case '1':
        redirectUrl = vendor.completeUrl;
        session.status = 'complete';
        vendor.completedSessions += 1;
        survey.completedSessions += 1;
        thankYouMessage = survey.completePageMessage;
        pageTitle = 'Complete';
        statusPageUrl = `/${survey.surveySlug}/complete`;
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
        statusPageUrl = `/${survey.surveySlug}/quotafull`;
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
        statusPageUrl = `/${survey.surveySlug}/security`;
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
        statusPageUrl = `/${survey.surveySlug}/terminate`;
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

    // Build final vendor redirect URL by replacing placeholder
    // session.queryParams is a plain object (from MongoDB), not a Map - use bracket notation
    const userIdValue = (session.queryParams && session.queryParams[vendor.entryParameter]) || otherParams[vendor.entryParameter] || '';
    const placeholder = `{{${vendor.parameterPlaceholder}}}`;
    const finalUrl = redirectUrl.replace(placeholder, userIdValue);

    console.log('Final redirect URL:', finalUrl);
    console.log('userIdValue:', userIdValue, 'entryParameter:', vendor.entryParameter, 'queryParams:', session.queryParams);

    console.log(`Exit redirect completed in ${Date.now() - startTime}ms`);

    // Return HTML thank you page with auto-redirect
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
            padding: 60px 40px;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333;
            margin-bottom: 30px;
            font-size: 32px;
          }
          p {
            color: #666;
            line-height: 1.8;
            font-size: 18px;
            margin-bottom: 30px;
          }
          .redirect-info {
            color: #999;
            font-size: 14px;
            margin-top: 20px;
          }
          .countdown {
            font-size: 48px;
            color: #667eea;
            font-weight: bold;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${pageTitle} - ${survey.name}</h1>
          <p>${thankYouMessage}</p>
          <div class="countdown" id="countdown">3</div>
          <div class="redirect-info">
            Redirecting you back in <span id="seconds">3</span> seconds...
          </div>
        </div>
        <div id="redirect-url" data-url="${finalUrl}" style="display:none"></div>
        <script>
          var redirectUrl = document.getElementById('redirect-url').getAttribute('data-url');
          var seconds = 3;
          var countdownEl = document.getElementById('countdown');
          var secondsEl = document.getElementById('seconds');

          var timer = setInterval(function() {
            seconds--;
            if (countdownEl) countdownEl.textContent = seconds;
            if (secondsEl) secondsEl.textContent = seconds;
            if (seconds <= 0) {
              clearInterval(timer);
              window.location.href = redirectUrl;
            }
          }, 1000);
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Survey exit error:', error);
    res.status(500).send('An error occurred');
  }
};
