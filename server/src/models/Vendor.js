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
  completeUrl: {
    type: String,
    required: true,
    trim: true
  },
  quotaFullUrl: {
    type: String,
    required: true,
    trim: true
  },
  terminateUrl: {
    type: String,
    required: true,
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

// Generate entry URL
vendorSchema.methods.getEntryUrl = function(baseUrl) {
  return `${baseUrl}/v/${this.vendorUuid}`;
};

module.exports = mongoose.model('Vendor', vendorSchema);