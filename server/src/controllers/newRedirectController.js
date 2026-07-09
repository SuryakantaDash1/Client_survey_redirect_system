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
    const { surveySlug, vendorSlug, urlSlug } = req.params;
    const queryParams = req.query;

    console.log('Entry request:', { surveySlug, vendorSlug, urlSlug, queryParams });

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

    // Resolve which client URL to use:
    // 1. If urlSlug provided, find matching entry in clientUrls array
    // 2. Else use first entry in clientUrls array
    // 3. Else fall back to legacy clientUrl field
    let resolvedClientUrl = survey.clientUrl || '';
    if (survey.clientUrls && survey.clientUrls.length > 0) {
      if (urlSlug) {
        const match = survey.clientUrls.find(u => u.urlSlug === urlSlug);
        resolvedClientUrl = match ? match.url : survey.clientUrls[0].url;
      } else {
        resolvedClientUrl = survey.clientUrls[0].url;
      }
    }

    // Validate survey URL
    if (!resolvedClientUrl.startsWith('http://') && !resolvedClientUrl.startsWith('https://')) {
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
      clientSurveyUrl: resolvedClientUrl,
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

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    // If this survey has a screener questionnaire, send respondent there first
    if (survey.screenerQuestions && survey.screenerQuestions.length > 0) {
      console.log(`Entry redirect to screener in ${Date.now() - startTime}ms`);
      return res.redirect(`${baseUrl}/screen/${session.trackingId}`);
    }

    // No screener — go straight to the client survey (original behavior)
    const redirectParams = {
      ...queryParams,
      tracking_id: session.trackingId,
      return_url: `${baseUrl}/exit/${survey.surveySlug}`
    };

    const redirectUrl = buildUrlWithParams(resolvedClientUrl, redirectParams);

    console.log(`Entry redirect completed in ${Date.now() - startTime}ms`);

    // Redirect to survey
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Vendor entry error:', error);
    res.status(500).send('An error occurred');
  }
};

// Helper: resolve thank you message and page title from status code
const resolveStatusMeta = (normalizedStatus, survey) => {
  if (normalizedStatus === '1' || normalizedStatus === 'complete') {
    return { thankYouMessage: survey.completePageMessage, pageTitle: 'Complete' };
  } else if (normalizedStatus === '3' || normalizedStatus === 'quota_full' || normalizedStatus === 'quotafull') {
    return { thankYouMessage: survey.quotaFullPageMessage, pageTitle: 'Quota Full' };
  } else if (normalizedStatus === '4' || normalizedStatus === 'security' || normalizedStatus === 'security_term') {
    return { thankYouMessage: survey.securityTermPageMessage, pageTitle: 'Security Term' };
  } else {
    return { thankYouMessage: survey.terminatePageMessage, pageTitle: 'Terminate' };
  }
};

// Status colour config
const STATUS_STYLES = {
  complete:  { color: '#2e7d32', bg: '#f1f8e9', icon: '✓', label: 'Survey Complete' },
  quota_full:{ color: '#e65100', bg: '#fff3e0', icon: '◎', label: 'Quota Full' },
  terminate: { color: '#6a1b9a', bg: '#f3e5f5', icon: '✕', label: 'Not Qualified' },
  security:  { color: '#1565c0', bg: '#e3f2fd', icon: '⚑', label: 'Security Check' },
};

const resolveStyle = (normalizedStatus) => {
  if (normalizedStatus === '1' || normalizedStatus === 'complete') return STATUS_STYLES.complete;
  if (normalizedStatus === '3' || normalizedStatus === 'quota_full' || normalizedStatus === 'quotafull') return STATUS_STYLES.quota_full;
  if (normalizedStatus === '4' || normalizedStatus === 'security' || normalizedStatus === 'security_term') return STATUS_STYLES.security;
  return STATUS_STYLES.terminate;
};

// Helper: build thank you page HTML
const buildThankYouHtml = (pageTitle, surveyName, thankYouMessage, finalUrl = null, normalizedStatus = '2') => {
  const hasRedirect = !!finalUrl;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const logoUrl = `${baseUrl}/public/logo.png`;
  const style = resolveStyle(normalizedStatus);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} - Binary & Beyond Research</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #2d1b69 0%, #6a1b9a 50%, #1565c0 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.35);
      max-width: 560px;
      width: 100%;
      overflow: hidden;
    }
    .card-header {
      background: #ffffff;
      border-bottom: 1px solid #eeeeee;
      padding: 24px 40px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .card-header img {
      height: 56px;
      width: auto;
    }
    .brand-text { color: #1a1a2e; }
    .brand-text h2 { font-size: 17px; font-weight: 700; letter-spacing: 0.3px; }
    .brand-text p { font-size: 12px; color: #666; margin-top: 2px; }
    .card-body { padding: 40px; text-align: center; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: ${style.bg};
      color: ${style.color};
      border-radius: 24px;
      padding: 8px 20px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 24px;
      text-transform: uppercase;
    }
    .status-badge .icon {
      font-size: 16px;
      font-weight: 700;
    }
    .card-body h1 {
      color: #1a1a2e;
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .divider {
      width: 48px;
      height: 3px;
      background: linear-gradient(90deg, #6a1b9a, #1565c0);
      border-radius: 2px;
      margin: 0 auto 24px;
    }
    .card-body p {
      color: #555;
      font-size: 15px;
      line-height: 1.8;
      margin-bottom: 32px;
    }
    .countdown-wrap {
      background: ${style.bg};
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 8px;
    }
    .countdown {
      font-size: 42px;
      font-weight: 800;
      color: ${style.color};
      line-height: 1;
    }
    .redirect-info { color: #999; font-size: 13px; margin-top: 8px; }
    .card-footer {
      background: #1a1a2e;
      padding: 20px 40px;
      text-align: center;
    }
    .card-footer p { color: #aaa; font-size: 12px; line-height: 1.6; }
    .card-footer a { color: #9c6fdb; text-decoration: none; }
    .footer-links { display: flex; justify-content: center; gap: 20px; margin-bottom: 10px; }
    .footer-links a { color: #ccc; font-size: 12px; text-decoration: none; }
    .footer-links a:hover { color: #9c6fdb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <img src="${logoUrl}" alt="Binary & Beyond Research" onerror="this.style.display='none'"/>
      <div class="brand-text">
        <h2>Binary &amp; Beyond Research</h2>
        <p>Market Research &amp; Investment Advisory</p>
      </div>
    </div>
    <div class="card-body">
      <div class="status-badge">
        <span class="icon">${style.icon}</span>
        ${style.label}
      </div>
      <h1>${thankYouMessage}</h1>
      <div class="divider"></div>
      ${hasRedirect ? `
      <div class="countdown-wrap">
        <div class="countdown" id="countdown">5</div>
        <div class="redirect-info">You will be redirected in <span id="seconds">5</span> seconds</div>
      </div>
      ` : `<p style="color:#999;font-size:13px;">You may now close this window.</p>`}
    </div>
    <div class="card-footer">
      <div class="footer-links">
        <a href="https://binaryandbeyondresearch.com" target="_blank">Website</a>
        <a href="https://binaryandbeyondresearch.com/contact" target="_blank">Contact Us</a>
        <a href="https://binaryandbeyondresearch.com/privacy" target="_blank">Privacy Policy</a>
      </div>
      <p>You are participating in a survey conducted by <a href="https://binaryandbeyondresearch.com" target="_blank">binaryandbeyondresearch.com</a></p>
    </div>
  </div>
  ${hasRedirect ? `
  <div id="redirect-url" data-url="${finalUrl}" style="display:none"></div>
  <script>
    var redirectUrl = document.getElementById('redirect-url').getAttribute('data-url');
    var seconds = 5;
    var countdownEl = document.getElementById('countdown');
    var secondsEl = document.getElementById('seconds');
    var timer = setInterval(function() {
      seconds--;
      if (countdownEl) countdownEl.textContent = seconds;
      if (secondsEl) secondsEl.textContent = seconds;
      if (seconds <= 0) { clearInterval(timer); window.location.href = redirectUrl; }
    }, 1000);
  </script>
  ` : ''}
</body>
</html>`;
};

// @desc    Handle survey exit callback (NEW STRUCTURE)
// @route   GET /exit/:surveySlug
// @access  Public
exports.handleSurveyExit = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { surveySlug } = req.params;
    const { status = '2', tracking_id } = req.query;
    const normalizedStatus = status.toString().toLowerCase();

    console.log('Exit request:', { surveySlug, status, tracking_id });

    // Find survey by slug
    const survey = await Survey.findOne({ surveySlug });
    if (!survey) {
      return res.status(404).send('Survey not found');
    }

    // ── FIND SESSION ──────────────────────────────────────────────────────────
    let session = null;

    if (tracking_id) {
      // Primary: exact match by tracking_id
      session = await Session.findOne({ trackingId: tracking_id });
      if (!session) {
        console.error('Session not found for tracking_id:', tracking_id);
      }
    }

    if (!session) {
      // No tracking_id provided (or not found) — find the most recent active session
      // for this survey. This handles clients whose platforms don't support parameter piping.
      session = await Session.findOne({ surveyId: survey._id, status: 'active' })
        .sort({ entryTime: -1 });

      if (session) {
        console.log('Session matched by most recent active (no tracking_id):', session.trackingId);
      }
    }

    // ── PREVIEW MODE ──────────────────────────────────────────────────────────
    // No session at all — show thank you message only (client previewing link directly)
    if (!session) {
      const { thankYouMessage, pageTitle } = resolveStatusMeta(normalizedStatus, survey);
      console.log('Preview mode: no active session found for survey:', surveySlug);
      return res.send(buildThankYouHtml(pageTitle, survey.name, thankYouMessage, null, normalizedStatus));
    }

    if (session.status !== 'active') {
      return res.status(400).send('Session already completed');
    }

    // Find vendor
    const vendor = await Vendor.findById(session.vendorId);
    if (!vendor) {
      return res.status(404).send('Vendor not found');
    }

    // Resolve thank you message from status
    const { thankYouMessage, pageTitle } = resolveStatusMeta(normalizedStatus, survey);

    // Match vendor redirect URL by status code
    const matchedRedirect = vendor.getRedirectUrlByStatus(normalizedStatus);
    const redirectUrl = matchedRedirect ? matchedRedirect.redirectUrl : null;

    // Update session status and counters
    const statusName = matchedRedirect ? (matchedRedirect.statusName || '').toLowerCase() : '';
    if (normalizedStatus === '1' || normalizedStatus === 'complete' || statusName.includes('complete')) {
      session.status = 'complete';
      vendor.completedSessions += 1;
      survey.completedSessions += 1;
    } else if (normalizedStatus === '3' || normalizedStatus === 'quota_full' || normalizedStatus === 'quotafull' || statusName.includes('quota')) {
      session.status = 'quota_full';
      vendor.quotaFullSessions += 1;
      survey.quotaFullSessions += 1;
    } else {
      session.status = 'terminate';
      vendor.terminatedSessions += 1;
      survey.terminatedSessions += 1;
    }

    session.exitTime = new Date();
    await session.save();
    await vendor.save();
    await survey.save();

    await logAnalytics('exit', session, session.status);

    console.log(`Exit redirect completed in ${Date.now() - startTime}ms`);

    if (!redirectUrl) {
      // Vendor has no matching redirect URL — show message without redirect
      console.warn('No matching redirect URL for status:', normalizedStatus, 'vendor:', vendor.name);
      return res.send(buildThankYouHtml(pageTitle, survey.name, thankYouMessage, null, normalizedStatus));
    }

    // Replace placeholder with actual respondent ID
    // queryParams is a Mongoose Map — must use .get() not bracket notation
    const userIdValue = (session.queryParams && session.queryParams.get(vendor.entryParameter)) || '';
    const placeholder = `{{${vendor.parameterPlaceholder}}}`;
    const finalUrl = redirectUrl.replace(placeholder, userIdValue);

    console.log('Final redirect URL:', finalUrl);

    return res.send(buildThankYouHtml(pageTitle, survey.name, thankYouMessage, finalUrl, normalizedStatus));

  } catch (error) {
    console.error('Survey exit error:', error);
    res.status(500).send('An error occurred');
  }
};

// Export helper so statusPageController can reuse the same branded layout
exports.buildThankYouHtml = buildThankYouHtml;
