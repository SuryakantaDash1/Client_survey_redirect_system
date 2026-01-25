const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['entry', 'exit'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'complete', 'quota_full', 'terminate']
  },
  responseTime: {
    type: Number // in milliseconds
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Indexes for performance
analyticsSchema.index({ surveyId: 1, timestamp: -1 });
analyticsSchema.index({ vendorId: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);