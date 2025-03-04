const express = require('express');
const router = express.Router();
const axios = require('axios');

// Simple test route
router.get('/test', async (req, res) => {
    try {
        const apiKey = process.env.CLICKUP_API_KEY || 'pk_84132000_89QTDVSH9ZPGW3WFSS5K8604I2KGOHMO';
        
        console.log('Testing ClickUp API with key:', apiKey.substring(0, 5) + '...');
        
        // Make a simple request to the ClickUp API to get teams
        const response = await axios({
            method: 'GET',
            url: 'https://api.clickup.com/api/v2/team',
            headers: {
                'Authorization': apiKey
            },
            timeout: 10000
        });
        
        res.json({
            success: true,
            message: 'ClickUp API connection successful',
            teams: response.data.teams.map(team => ({
                id: team.id,
                name: team.name
            }))
        });
    } catch (error) {
        console.error('ClickUp API Test Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'ClickUp API connection failed',
            error: error.response?.data || error.message
        });
    }
});

module.exports = router;