const Survey = require('../models/Survey');

// @desc    Show public status page (Complete, Terminate, Quota Full, Security)
// @route   GET /:surveySlug/:status (complete|terminate|quotafull|security)
// @access  Public
exports.showStatusPage = async (req, res, next) => {
  try {
    const { surveySlug, status } = req.params;

    // Find survey by slug
    const survey = await Survey.findOne({ surveySlug });
    if (!survey) {
      return res.status(404).send('Survey not found');
    }

    // Determine which message to show
    let message, pageTitle, statusCode;
    switch (status.toLowerCase()) {
      case 'complete':
        message = survey.completePageMessage;
        pageTitle = 'Survey Complete';
        statusCode = '1';
        break;
      case 'terminate':
        message = survey.terminatePageMessage;
        pageTitle = 'Not Qualified';
        statusCode = '2';
        break;
      case 'quotafull':
        message = survey.quotaFullPageMessage;
        pageTitle = 'Survey Full';
        statusCode = '3';
        break;
      case 'security':
        message = survey.securityTermPageMessage;
        pageTitle = 'Session Expired';
        statusCode = '4';
        break;
      default:
        return res.status(404).send('Invalid status page');
    }

    // Return HTML status page
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
            margin-bottom: 20px;
          }
          .status-code {
            color: #999;
            font-size: 14px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${pageTitle}</h1>
          <div class="status-code">Status Code: ${statusCode}</div>
          <p>${message}</p>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Status page error:', error);
    res.status(500).send('An error occurred');
  }
};
