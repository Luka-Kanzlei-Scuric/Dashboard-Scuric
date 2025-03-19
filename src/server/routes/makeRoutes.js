import express from 'express';
import Form from '../models/Form.js';

const router = express.Router();

// Log-System für das Dashboard
const logs = [];
const MAX_LOGS = 100;

// Log-Funktion
function addLog(type, message, details = null, source = 'System') {
    const logEntry = {
        type: type,
        message,
        details,
        source,
        timestamp: new Date()
    };
    
    logs.unshift(logEntry);
    
    if (logs.length > MAX_LOGS) {
        logs.pop();
    }
    
    console.log(`[${type.toUpperCase()}] ${message}`);
    return logEntry;
}

// Get logs function
function getLogs() {
    return logs;
}

// Handle Make.com webhook
router.post('/webhook', async (req, res) => {
    try {
        const taskData = req.body;
        const taskId = taskData.id || taskData.taskId || taskData.task_id;
        const leadName = taskData.name || taskData.title || taskData.leadName;

        let form = await Form.findOne({ taskId });

        if (form) {
            form.leadName = leadName;
            form.updatedAt = new Date();
            await form.save();
            addLog('info', `Task aktualisiert: ${leadName}`, { taskId });
        } else {
            form = new Form({
                taskId,
                leadName,
                phase: 'erstberatung',
                qualifiziert: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await form.save();
            addLog('success', `Neuer Task erstellt: ${leadName}`, { taskId });
        }

        res.json({
            success: true,
            message: `Task ${form._id ? 'updated' : 'created'} successfully`,
            form
        });
    } catch (error) {
        console.error('Make.com webhook error:', error);
        addLog('error', 'Fehler bei der Verarbeitung eines Make.com Webhooks', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Error processing webhook',
            error: error.message
        });
    }
});

// Get logs endpoint
router.get('/logs', (req, res) => {
    res.json({
        success: true,
        logs: getLogs()
    });
});

export default router;
export { addLog, getLogs }; 