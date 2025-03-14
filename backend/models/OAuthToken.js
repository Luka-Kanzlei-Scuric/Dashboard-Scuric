// models/OAuthToken.js
const mongoose = require('mongoose');

const OAuthTokenSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    enum: ['clickup'],
    default: 'clickup'
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Before saving, update the updatedAt timestamp
OAuthTokenSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('OAuthToken', OAuthTokenSchema);