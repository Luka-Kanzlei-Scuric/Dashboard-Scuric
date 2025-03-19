import express from 'express';

const router = express.Router();

// Get all integrations
router.get('/', (req, res) => {
    res.json({ message: 'Integrations endpoint' });
});

export default router; 