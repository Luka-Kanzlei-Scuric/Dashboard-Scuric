import express from 'express';
import Form from '../models/Form.js';

const router = express.Router();

// Get dashboard statistics
router.get('/', async (req, res) => {
    try {
        const totalForms = await Form.countDocuments();
        const formsByPhase = await Form.aggregate([
            {
                $group: {
                    _id: '$phase',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            totalForms,
            formsByPhase
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router; 