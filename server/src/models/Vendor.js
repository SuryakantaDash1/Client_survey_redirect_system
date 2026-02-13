const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

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
  vendorUuid: {
    type: String,
    unique: true,
    default: uuidv4
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

// Pre-save hook to auto-generate status URLs
vendorSchema.pre('save', function(next) {
  if (this.baseRedirectUrl) {
    const baseUrl = this.baseRedirectUrl;
    const separator = baseUrl.includes('?') ? '&' : '?';

    // Generate 4 URLs with status parameters
    this.completeUrl = `${baseUrl}${separator}status=1&pid={{TOID}}`;
    this.terminateUrl = `${baseUrl}${separator}status=2&pid={{TOID}}`;
    this.quotaFullUrl = `${baseUrl}${separator}status=3&pid={{TOID}}`;
    this.securityTermUrl = `${baseUrl}${separator}status=4&pid={{TOID}}`;
  }
  next();
});

// Generate entry URL
vendorSchema.methods.getEntryUrl = function(baseUrl) {
  return `${baseUrl}/v/${this.vendorUuid}`;
};

module.exports = mongoose.model('Vendor', vendorSchema);