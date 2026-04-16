const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const vendorSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  vendorSlug: {
    type: String,
    trim: true
  },
  vendorUuid: {
    type: String,
    unique: true,
    default: uuidv4
  },
  // Entry parameter configuration
  entryParameter: {
    type: String,
    required: true,
    default: 'user_id',
    trim: true
  },
  parameterPlaceholder: {
    type: String,
    required: true,
    default: 'TOID',
    trim: true
  },
  // Flexible redirect URLs - each entry maps status codes to a vendor-provided URL
  // Example: { statusName: "Complete", statusCodes: ["1", "complete", "A"], redirectUrl: "https://vendor.com/cb?st=1&uid={{TOID}}" }
  redirectUrls: [{
    statusName: {
      type: String,
      required: true,
      trim: true
    },
    statusCodes: [{
      type: String,
      trim: true
    }],
    redirectUrl: {
      type: String,
      required: true,
      trim: true
    }
  }],
  // Legacy fields kept for backward compatibility with existing data
  baseRedirectUrl: {
    type: String,
    trim: true
  },
  completeUrl: {
    type: String,
    trim: true
  },
  quotaFullUrl: {
    type: String,
    trim: true
  },
  terminateUrl: {
    type: String,
    trim: true
  },
  securityTermUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  completedSessions: {
    type: Number,
    default: 0
  },
  quotaFullSessions: {
    type: Number,
    default: 0
  },
  terminatedSessions: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Pre-save hook to auto-generate slug
vendorSchema.pre('save', async function(next) {
  try {
    // Generate vendor slug if new
    if (!this.vendorSlug && this.isNew) {
      let slug = generateSlug(this.name);
      let counter = 1;

      // Check for uniqueness within the same survey
      while (await this.constructor.findOne({
        surveyId: this.surveyId,
        vendorSlug: slug
      })) {
        slug = generateSlug(this.name) + '-' + counter;
        counter++;
      }

      this.vendorSlug = slug;
      console.log('Generated vendor slug:', slug, 'for vendor:', this.name);
    }

    // Sync legacy fields from redirectUrls for backward compatibility
    if (this.redirectUrls && this.redirectUrls.length > 0) {
      const findUrlByCode = (code) => {
        const match = this.redirectUrls.find(r =>
          r.statusCodes.some(c => c.toLowerCase() === code)
        );
        return match ? match.redirectUrl : '';
      };
      this.completeUrl = findUrlByCode('1') || findUrlByCode('complete');
      this.terminateUrl = findUrlByCode('2') || findUrlByCode('terminate');
      this.quotaFullUrl = findUrlByCode('3') || findUrlByCode('quotafull');
      this.securityTermUrl = findUrlByCode('4') || findUrlByCode('security');
    }

    next();
  } catch (error) {
    console.error('Error in vendor pre-save hook:', error);
    next(error);
  }
});

// Helper: find redirect URL by status code from the redirectUrls array
vendorSchema.methods.getRedirectUrlByStatus = function(statusCode) {
  const normalized = statusCode.toString().toLowerCase();

  // First try the new redirectUrls array
  if (this.redirectUrls && this.redirectUrls.length > 0) {
    const match = this.redirectUrls.find(r =>
      r.statusCodes.some(c => c.toLowerCase() === normalized)
    );
    if (match) return match;
  }

  // Fallback to legacy fields for old vendors
  const legacyMap = {
    '1': { statusName: 'Complete', redirectUrl: this.completeUrl },
    'complete': { statusName: 'Complete', redirectUrl: this.completeUrl },
    '2': { statusName: 'Terminate', redirectUrl: this.terminateUrl },
    'terminate': { statusName: 'Terminate', redirectUrl: this.terminateUrl },
    'terminated': { statusName: 'Terminate', redirectUrl: this.terminateUrl },
    '3': { statusName: 'Quota Full', redirectUrl: this.quotaFullUrl },
    'quota_full': { statusName: 'Quota Full', redirectUrl: this.quotaFullUrl },
    'quotafull': { statusName: 'Quota Full', redirectUrl: this.quotaFullUrl },
    '4': { statusName: 'Security', redirectUrl: this.securityTermUrl || this.terminateUrl },
    'security': { statusName: 'Security', redirectUrl: this.securityTermUrl || this.terminateUrl },
    'security_term': { statusName: 'Security', redirectUrl: this.securityTermUrl || this.terminateUrl },
  };

  return legacyMap[normalized] || null;
};

// Generate entry URL with new structure: /r/{surveySlug}/{vendorSlug}
vendorSchema.methods.getEntryUrl = async function(baseUrl) {
  const Survey = require('./Survey');
  const survey = await Survey.findById(this.surveyId);
  if (!survey) {
    throw new Error('Survey not found');
  }
  return `${baseUrl}/r/${survey.surveySlug}/${this.vendorSlug}`;
};

module.exports = mongoose.model('Vendor', vendorSchema);