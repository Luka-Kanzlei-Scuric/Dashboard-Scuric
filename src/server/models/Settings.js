const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    notifications: {
        type: Boolean,
        default: true
    },
    darkMode: {
        type: Boolean,
        default: false
    },
    language: {
        type: String,
        default: 'en',
        enum: ['en', 'de', 'fr', 'es']
    },
    timezone: {
        type: String,
        default: 'UTC',
        enum: ['UTC', 'CET', 'EST', 'PST']
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

// Update the updatedAt timestamp before saving
settingsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Settings', settingsSchema); 