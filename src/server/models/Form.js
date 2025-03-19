const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
    taskId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    leadName: {
        type: String,
        required: true
    },
    phase: {
        type: String,
        enum: ['erstberatung', 'checkliste', 'dokumente', 'abgeschlossen'],
        default: 'erstberatung'
    },
    qualifiziert: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Form', formSchema); 