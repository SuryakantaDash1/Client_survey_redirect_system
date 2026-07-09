const Survey = require('../models/Survey');
const Session = require('../models/Session');
const Vendor = require('../models/Vendor');
const Analytics = require('../models/Analytics');
const { buildThankYouHtml } = require('./newRedirectController');

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

const buildUrlWithParams = (baseUrl, params) => {
  if (!params || Object.keys(params).length === 0) return baseUrl;
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.append(key, value);
  });
  return url.toString();
};

const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// @desc    Show the screener questionnaire (all questions on one page)
// @route   GET /screen/:trackingId
// @access  Public
exports.showScreener = async (req, res, next) => {
  try {
    const { trackingId } = req.params;

    const session = await Session.findOne({ trackingId });
    if (!session) {
      return res.status(404).send('Session not found. Please use the correct entry link.');
    }

    const survey = await Survey.findById(session.surveyId);
    if (!survey) {
      return res.status(404).send('Survey not found');
    }

    // No questions configured — pass straight through to the survey
    if (!survey.screenerQuestions || survey.screenerQuestions.length === 0) {
      return res.redirect(buildSurveyRedirect(survey, session));
    }

    // Already past the screener / completed — don't allow re-answering
    if (session.status !== 'active') {
      return res.status(400).send('This session has already been processed.');
    }

    const questions = [...survey.screenerQuestions].sort((a, b) => (a.order || 0) - (b.order || 0));
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const logoUrl = `${baseUrl}/public/logo.png`;

    const questionsHtml = questions.map((q, qi) => {
      const req = q.required ? 'required' : '';
      const requiredMark = q.required ? ' <span class="required-star">*</span>' : ' <span class="optional">(optional)</span>';
      let fieldHtml;

      if (q.type === 'text') {
        fieldHtml = `<input class="field" type="text" name="q${qi}" placeholder="Type your answer" ${req}>`;
      } else if (q.type === 'number') {
        fieldHtml = `<input class="field" type="number" name="q${qi}" placeholder="Enter a number" ${req}>`;
      } else if (q.type === 'textarea') {
        fieldHtml = `<textarea class="field" name="q${qi}" rows="3" placeholder="Type your answer" ${req}></textarea>`;
      } else {
        // mcq
        const optionsHtml = q.options.map((opt, oi) => `
          <label class="option">
            <input type="radio" name="q${qi}" value="${oi}" ${req}>
            <span>${escapeHtml(opt.text)}</span>
          </label>
        `).join('');
        fieldHtml = `<div class="options">${optionsHtml}</div>`;
      }

      return `
        <div class="question">
          <div class="q-title"><span class="q-num">${qi + 1}.</span> ${escapeHtml(q.questionText)}${requiredMark}</div>
          ${fieldHtml}
        </div>
      `;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Qualification - ${escapeHtml(survey.name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #2d1b69 0%, #6a1b9a 50%, #1565c0 100%);
      min-height: 100vh; padding: 24px; color: #1a1a2e;
    }
    .card { background:#fff; border-radius:16px; box-shadow:0 24px 64px rgba(0,0,0,0.35);
      max-width:680px; margin:24px auto; overflow:hidden; }
    .card-header { background:#fff; border-bottom:1px solid #eee; padding:24px 40px;
      display:flex; align-items:center; gap:16px; }
    .card-header img { height:52px; width:auto; }
    .brand-text h2 { font-size:17px; font-weight:700; }
    .brand-text p { font-size:12px; color:#666; margin-top:2px; }
    .card-body { padding:32px 40px; }
    .intro { color:#555; font-size:15px; margin-bottom:24px; line-height:1.6; }
    .question { margin-bottom:28px; }
    .q-title { font-size:16px; font-weight:600; margin-bottom:14px; line-height:1.5; }
    .q-num { color:#6a1b9a; font-weight:700; }
    .optional { font-size:12px; color:#999; font-weight:400; }
    .required-star { color:#e53935; font-weight:700; }
    .field { width:100%; padding:13px 16px; border:1.5px solid #e0e0e0; border-radius:10px;
      font-size:15px; font-family:inherit; outline:none; transition:border-color .15s; }
    .field:focus { border-color:#6a1b9a; }
    .options { display:flex; flex-direction:column; gap:10px; }
    .option { display:flex; align-items:center; gap:12px; padding:14px 16px;
      border:1.5px solid #e0e0e0; border-radius:10px; cursor:pointer; transition:all .15s;
      font-size:15px; }
    .option:hover { border-color:#6a1b9a; background:#faf5ff; }
    .option input { width:18px; height:18px; accent-color:#6a1b9a; cursor:pointer; }
    .option input:checked + span { font-weight:600; }
    .submit-btn { width:100%; padding:16px; margin-top:8px; border:none; border-radius:10px;
      background:linear-gradient(135deg,#6a1b9a,#1565c0); color:#fff; font-size:16px;
      font-weight:700; cursor:pointer; letter-spacing:.3px; }
    .submit-btn:hover { opacity:.92; }
    .card-footer { background:#1a1a2e; padding:18px 40px; text-align:center; }
    .card-footer p { color:#aaa; font-size:12px; }
    .card-footer a { color:#9c6fdb; text-decoration:none; }
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
    <form class="card-body" method="POST" action="${baseUrl}/screen/${trackingId}/submit">
      <p class="intro">Please answer the following questions to check your eligibility for this study.</p>
      ${questionsHtml}
      <button type="submit" class="submit-btn">Submit &amp; Continue</button>
    </form>
    <div class="card-footer">
      <p>Conducted by <a href="https://binaryandbeyondresearch.com" target="_blank">binaryandbeyondresearch.com</a></p>
    </div>
  </div>
</body>
</html>`;

    res.send(html);
  } catch (error) {
    console.error('Screener render error:', error);
    res.status(500).send('An error occurred');
  }
};

// @desc    Evaluate screener answers
// @route   POST /screen/:trackingId/submit
// @access  Public
exports.submitScreener = async (req, res, next) => {
  try {
    const { trackingId } = req.params;

    const session = await Session.findOne({ trackingId });
    if (!session) {
      return res.status(404).send('Session not found.');
    }
    if (session.status !== 'active') {
      return res.status(400).send('This session has already been processed.');
    }

    const survey = await Survey.findById(session.surveyId);
    if (!survey) {
      return res.status(404).send('Survey not found');
    }

    const questions = [...survey.screenerQuestions].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Collect answers and determine the most restrictive action
    // Priority: terminate > quota_full > survey-route/continue
    let outcome = 'continue';
    let routeUrlSlug = null; // which client survey link to open (from a 'survey:<slug>' action)
    const answers = [];

    questions.forEach((q, qi) => {
      const raw = req.body[`q${qi}`];

      // Field-type questions (text/number/textarea) just collect the typed answer — no routing
      if (q.type && q.type !== 'mcq') {
        answers.push({
          questionText: q.questionText,
          answerText: (raw !== undefined && raw !== '') ? String(raw) : '(no answer)',
          action: 'continue'
        });
        return;
      }

      // MCQ — evaluate the selected option's action
      const selectedIdx = parseInt(raw, 10);
      const opt = (!isNaN(selectedIdx) && q.options[selectedIdx]) ? q.options[selectedIdx] : null;
      const action = opt ? (opt.action || 'continue') : 'continue';

      answers.push({
        questionText: q.questionText,
        answerText: opt ? opt.text : '(no answer)',
        action
      });

      if (action === 'terminate') {
        outcome = 'terminate';
      } else if (action === 'quota_full' && outcome !== 'terminate') {
        outcome = 'quota_full';
      } else if (action.startsWith('survey:') && !routeUrlSlug) {
        // First routing answer wins (by question order)
        routeUrlSlug = action.slice('survey:'.length);
      }
    });

    session.screenerAnswers = answers;

    // ── DISQUALIFIED ──────────────────────────────────────────────────────────
    if (outcome === 'terminate' || outcome === 'quota_full') {
      const vendor = await Vendor.findById(session.vendorId);

      if (outcome === 'terminate') {
        session.status = 'terminate';
        session.terminationSource = 'screener';
        survey.terminatedSessions += 1;
        if (vendor) vendor.terminatedSessions += 1;
      } else {
        session.status = 'quota_full';
        session.terminationSource = 'screener';
        survey.quotaFullSessions += 1;
        if (vendor) vendor.quotaFullSessions += 1;
      }

      session.exitTime = new Date();
      await session.save();
      await survey.save();
      if (vendor) await vendor.save();
      await logAnalytics('screener_exit', session, session.status);

      const normalizedStatus = outcome === 'terminate' ? '2' : '3';
      const pageTitle = outcome === 'terminate' ? 'Not Qualified' : 'Quota Full';
      const message = outcome === 'terminate' ? survey.terminatePageMessage : survey.quotaFullPageMessage;

      // No vendor redirect from screener — just show the branded status page
      return res.send(buildThankYouHtml(pageTitle, survey.name, message, null, normalizedStatus));
    }

    // ── QUALIFIED → continue to the client survey ─────────────────────────────
    // If an answer routed to a specific survey link, record it on the session
    if (routeUrlSlug && survey.clientUrls && survey.clientUrls.length > 0) {
      const match = survey.clientUrls.find(u => u.urlSlug === routeUrlSlug);
      if (match) session.clientSurveyUrl = match.url;
    }

    await session.save();
    await logAnalytics('screener_pass', session, 'active');

    return res.redirect(buildSurveyRedirect(survey, session));
  } catch (error) {
    console.error('Screener submit error:', error);
    res.status(500).send('An error occurred');
  }
};

// Build the client survey redirect URL with tracking params
function buildSurveyRedirect(survey, session) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const queryParams = {};
  if (session.queryParams) {
    for (const [k, v] of session.queryParams.entries()) queryParams[k] = v;
  }
  const redirectParams = {
    ...queryParams,
    tracking_id: session.trackingId,
    return_url: `${baseUrl}/exit/${survey.surveySlug}`
  };

  // Resolve target: session's stored URL → legacy clientUrl → first clientUrls entry
  let target = session.clientSurveyUrl || survey.clientUrl || '';
  if ((!target || !target.startsWith('http')) && survey.clientUrls && survey.clientUrls.length > 0) {
    target = survey.clientUrls[0].url;
  }

  console.log('Screener pass redirect:', { trackingId: session.trackingId, target });

  if (!target || !target.startsWith('http')) {
    throw new Error('No valid client survey URL configured for this survey');
  }

  return buildUrlWithParams(target, redirectParams);
}
