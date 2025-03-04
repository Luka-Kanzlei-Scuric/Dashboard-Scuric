const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const formController = require('../controllers/formController');

// Middleware für Logging
const requestLogger = (req, res, next) => {
    console.log(`📩 [${req.method}] Anfrage an ${req.originalUrl}`);
    console.log("📦 Body:", req.body);
    next();
};

router.use(requestLogger);

// Test Route
router.post('/test', (req, res) => {
    console.log("✅ Test Route erreicht!");
    console.log("📦 Body:", req.body);
    res.json({ message: "Test erfolgreich!" });
});

// Rufe alle Formulare ab (für Dashboard)
router.get('/', async (req, res) => {
    try {
        await formController.getAllForms(req, res);
    } catch (error) {
        console.error("❌ Fehler bei GET /:", error.message);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

// Get Form by TaskId
router.get('/:taskId', async (req, res) => {
    try {
        await formController.getFormByTaskId(req, res);
    } catch (error) {
        console.error("❌ Fehler bei GET /:taskId:", error.message);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

// Create Form
router.post(
    '/',
    [
        body('taskId').notEmpty().withMessage('taskId ist erforderlich'),
        body('leadName').optional().isString().withMessage('leadName muss ein String sein')
    ],
    async (req, res) => {
        try {
            await formController.createForm(req, res);
        } catch (error) {
            console.error("❌ Fehler bei POST /:", error.message);
            res.status(500).json({ error: "Interner Serverfehler" });
        }
    }
);

// Update Form
router.put('/:taskId', async (req, res) => {
    try {
        await formController.updateForm(req, res);
    } catch (error) {
        console.error("❌ Fehler bei PUT /:taskId:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

// Update client phase
router.put('/:taskId/phase', async (req, res) => {
    try {
        await formController.updateClientPhase(req, res);
    } catch (error) {
        console.error("❌ Fehler bei PUT /:taskId/phase:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

// Document management
// Add document metadata
router.post('/:taskId/documents', async (req, res) => {
    try {
        await formController.addDocument(req, res);
    } catch (error) {
        console.error("❌ Fehler bei POST /:taskId/documents:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

// Remove document
router.delete('/:taskId/documents/:documentId', async (req, res) => {
    try {
        await formController.removeDocument(req, res);
    } catch (error) {
        console.error("❌ Fehler bei DELETE /:taskId/documents/:documentId:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

module.exports = router;