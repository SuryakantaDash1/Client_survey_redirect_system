const Survey = require('../models/Survey');
const { buildThankYouHtml } = require('./newRedirectController');

// @desc    Show public status page (Complete, Terminate, Quota Full, Security)
// @route   GET /:surveySlug/:status (complete|terminate|quotafull|security)
// @access  Public
exports.showStatusPage = async (req, res, next) => {
  try {
    const { surveySlug } = req.params;
    const pathParts = req.path.split('/');
    const status = pathParts[pathParts.length - 1].toLowerCase();

    const survey = await Survey.findOne({ surveySlug });
    if (!survey) {
      return res.status(404).send('Survey not found');
    }

    let message, pageTitle, normalizedStatus;
    switch (status) {
      case 'complete':
        message = survey.completePageMessage;
        pageTitle = 'Survey Complete';
        normalizedStatus = '1';
        break;
      case 'terminate':
        message = survey.terminatePageMessage;
        pageTitle = 'Not Qualified';
        normalizedStatus = '2';
        break;
      case 'quotafull':
        message = survey.quotaFullPageMessage;
        pageTitle = 'Quota Full';
        normalizedStatus = '3';
        break;
      case 'security':
        message = survey.securityTermPageMessage;
        pageTitle = 'Security Check';
        normalizedStatus = '4';
        break;
      default:
        return res.status(404).send('Invalid status page');
    }

    res.send(buildThankYouHtml(pageTitle, survey.name, message, null, normalizedStatus));
  } catch (error) {
    console.error('Status page error:', error);
    res.status(500).send('An error occurred');
  }
};
