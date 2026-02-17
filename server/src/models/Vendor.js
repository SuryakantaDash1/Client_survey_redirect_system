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
  // Base vendor URL - we'll append status parameters to this
  baseRedirectUrl: {
    type: String,
    required: true,
    trim: true
  },
  // Auto-generated URLs based on baseRedirectUrl
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

// Pre-save hook to auto-generate slug and status URLs
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

    // Generate 4 URLs with status parameters and custom placeholder
    if (this.baseRedirectUrl) {
      const baseUrl = this.baseRedirectUrl;
      const separator = baseUrl.includes('?') ? '&' : '?';
      const placeholder = `{{${this.parameterPlaceholder}}}`;

      this.completeUrl = `${baseUrl}${separator}status=1&${this.entryParameter}=${placeholder}`;
      this.terminateUrl = `${baseUrl}${separator}status=2&${this.entryParameter}=${placeholder}`;
      this.quotaFullUrl = `${baseUrl}${separator}status=3&${this.entryParameter}=${placeholder}`;
      this.securityTermUrl = `${baseUrl}${separator}status=4&${this.entryParameter}=${placeholder}`;
    }
    next();
  } catch (error) {
    console.error('Error in vendor pre-save hook:', error);
    next(error);
  }
});

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