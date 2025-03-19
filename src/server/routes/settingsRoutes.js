import express from 'express';

const router = express.Router();
const Settings = require('../models/Settings');

// Get user settings
router.get('/:userId', async (req, res) => {
    try {
        const settings = await Settings.findOne({ userId: req.params.userId });
        if (!settings) {
            // Create default settings if none exist
            const defaultSettings = new Settings({
                userId: req.params.userId
            });
            await defaultSettings.save();
            return res.json(defaultSettings);
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// Update user settings
router.put('/:userId', async (req, res) => {
    try {
        const settings = await Settings.findOneAndUpdate(
            { userId: req.params.userId },
            {
                $set: {
                    notifications: req.body.notifications,
                    darkMode: req.body.darkMode,
                    language: req.body.language,
                    timezone: req.body.timezone
                }
            },
            { new: true, upsert: true }
        );
        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
});

// Get settings
router.get('/', (req, res) => {
    res.json({
        settings: {
            notifications: true,
            theme: 'light',
            language: 'de'
        }
    });
});

// Update settings
router.put('/', (req, res) => {
    res.json({ message: 'Settings updated' });
});

export default router; 