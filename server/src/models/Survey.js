const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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

module.exports = mongoose.model('Survey', surveySchema);