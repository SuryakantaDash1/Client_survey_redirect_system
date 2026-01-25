const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    default: uuidv4
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  queryParams: {
    type: Map,
    of: String
  },
  status: {
    type: String,
    enum: ['active', 'complete', 'quota_full', 'terminate'],
    default: 'active'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  entryTime: {
    type: Date,
    default: Date.now
  },
  exitTime: {
    type: Date
  },
  duration: {
    type: Number // in milliseconds
  }
}, {
  timestamps: true
});

// Calculate duration on exit
sessionSchema.pre('save', function(next) {
  if (this.exitTime && this.entryTime) {
    this.duration = this.exitTime - this.entryTime;
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);