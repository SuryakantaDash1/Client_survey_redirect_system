const mongoose = require('mongoose');

// Helper function to generate slug from name
const generateSlug = (name) => {
  const year = new Date().getFullYear();
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + year;
};

const surveySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  surveySlug: {
    type: String,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  clientUrl: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  },
  // Thank you page messages for each status (REQUIRED)
  completePageMessage: {
    type: String,
    required: true,
    default: 'Thank you for your participation. The survey has been completed successfully. Your inputs are valuable and will help us improve healthcare insights.'
  },
  terminatePageMessage: {
    type: String,
    required: true,
    default: 'Thank you for your participation. Based on your responses, you do not meet the criteria for this study, and the survey has been terminated. We will reach out to you for future survey opportunities.'
  },
  quotaFullPageMessage: {
    type: String,
    required: true,
    default: 'Thank you for your participation. The required quota for this survey has already been completed. We appreciate your time and interest.'
  },
  securityTermPageMessage: {
    type: String,
    required: true,
    default: 'Thank you for your participation'
  }
}, {
  timestamps: true
});

// Virtual for vendors
surveySchema.virtual('vendors', {
  ref: 'Vendor',
  localField: '_id',
  foreignField: 'surveyId'
});

// Pre-save hook to generate slug
surveySchema.pre('save', async function(next) {
  try {
    if (!this.surveySlug && this.isNew) {
      let slug = generateSlug(this.name);
      let counter = 1;

      // Check for uniqueness and add counter if needed
      while (await this.constructor.findOne({ surveySlug: slug })) {
        slug = generateSlug(this.name) + '-' + counter;
        counter++;
      }

      this.surveySlug = slug;
      console.log('Generated slug:', slug, 'for survey:', this.name);
    }
    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    next(error);
  }
});

// Method to get status page URLs
surveySchema.methods.getStatusPageUrls = function(baseUrl) {
  return {
    complete: `${baseUrl}/${this.surveySlug}/complete`,
    terminate: `${baseUrl}/${this.surveySlug}/terminate`,
    quotaFull: `${baseUrl}/${this.surveySlug}/quotafull`,
    security: `${baseUrl}/${this.surveySlug}/security`,
    exitCallback: `${baseUrl}/exit/${this.surveySlug}`
  };
};

module.exports = mongoose.model('Survey', surveySchema);