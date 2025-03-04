const clickupUtils = require('../utils/clickupUtils');
const Form = require('../models/Form');

// Sync a specific form with ClickUp
exports.syncFormWithClickUp = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        // Fetch the form from our database
        const form = await Form.findOne({ taskId });
        if (!form) {
            return res.status(404).json({ message: 'Formular nicht gefunden' });
        }
        
        // Sync the form with ClickUp
        const result = await clickupUtils.syncFormToClickUp(form);
        
        res.json({ 
            message: 'Formular erfolgreich mit ClickUp synchronisiert',
            clickUpTaskId: result.id
        });
    } catch (error) {
        console.error('❌ Fehler bei der ClickUp-Synchronisierung:', error.message);
        res.status(500).json({ 
            message: 'Fehler bei der ClickUp-Synchronisierung', 
            error: error.message 
        });
    }
};

// Get all ClickUp tasks from the leads list
exports.getLeads = async (req, res) => {
    try {
        const listId = process.env.CLICKUP_LEADS_LIST_ID;
        if (!listId) {
            return res.status(400).json({ message: 'CLICKUP_LEADS_LIST_ID nicht konfiguriert' });
        }
        
        console.log(`Attempting to fetch tasks from ClickUp list: ${listId}`);
        
        // Direct API call for testing
        try {
            const axios = require('axios');
            const response = await axios({
                method: 'GET',
                url: `https://api.clickup.com/api/v2/list/${listId}/task`,
                headers: {
                    'Authorization': process.env.CLICKUP_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Direct API call succeeded');
            const tasks = response.data;
            
            res.json({
                message: 'Leads erfolgreich abgerufen',
                tasks: tasks.tasks
            });
        } catch (directError) {
            console.error('Direct API call failed:', directError.response?.status, directError.response?.data || directError.message);
            
            // Fall back to the utility function
            console.log('Falling back to utility function');
            const tasks = await clickupUtils.getTasksFromList(listId);
            
            res.json({
                message: 'Leads erfolgreich abgerufen',
                tasks: tasks.tasks
            });
        }
    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Leads:', error.message);
        res.status(500).json({ 
            message: 'Fehler beim Abrufen der Leads', 
            error: error.message 
        });
    }
};

// Get all ClickUp tasks from the offers list
exports.getOffers = async (req, res) => {
    try {
        const listId = process.env.CLICKUP_ANGEBOTE_LIST_ID;
        if (!listId) {
            return res.status(400).json({ message: 'CLICKUP_ANGEBOTE_LIST_ID nicht konfiguriert' });
        }
        
        const tasks = await clickupUtils.getTasksFromList(listId);
        
        res.json({
            message: 'Angebote erfolgreich abgerufen',
            tasks: tasks.tasks
        });
    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Angebote:', error.message);
        res.status(500).json({ 
            message: 'Fehler beim Abrufen der Angebote', 
            error: error.message 
        });
    }
};

// Import a task from ClickUp to our system
exports.importClickUpTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        // Check if we already have this task in our system
        const existingForm = await Form.findOne({ taskId });
        if (existingForm) {
            return res.status(400).json({ 
                message: 'Aufgabe bereits importiert', 
                form: existingForm 
            });
        }
        
        // Get the task from ClickUp
        const task = await clickupUtils.getTask(taskId);
        
        // Create a new form in our system
        const form = new Form({
            taskId: task.id,
            leadName: task.name.split(' - ')[0] || task.name, // Assume format "Name - Privatinsolvenz"
            phase: 'erstberatung', // Default starting phase
            qualifiziert: false // Default qualification status
        });
        
        const savedForm = await form.save();
        
        res.status(201).json({
            message: 'ClickUp-Aufgabe erfolgreich importiert',
            form: savedForm
        });
    } catch (error) {
        console.error('❌ Fehler beim Importieren der ClickUp-Aufgabe:', error.message);
        res.status(500).json({ 
            message: 'Fehler beim Importieren der ClickUp-Aufgabe', 
            error: error.message 
        });
    }
};

// Webhook handler for ClickUp events
exports.handleClickUpWebhook = async (req, res) => {
    try {
        const event = req.body;
        console.log('📩 ClickUp Webhook event received:', event.event);
        
        // Process different types of events
        switch (event.event) {
            case 'taskCreated':
            case 'taskUpdated':
                // Automatically import or update task
                const taskId = event.task_id;
                const task = await clickupUtils.getTask(taskId);
                
                // Check if we already have this task
                let form = await Form.findOne({ taskId });
                
                if (form) {
                    // Update existing form with data from ClickUp
                    // This is a simple example - you would want more complex mapping
                    form.leadName = task.name.split(' - ')[0] || task.name;
                    await form.save();
                    console.log(`✅ Form ${taskId} updated from ClickUp webhook`);
                } else {
                    // Create new form from ClickUp task
                    form = new Form({
                        taskId: task.id,
                        leadName: task.name.split(' - ')[0] || task.name,
                        phase: 'erstberatung',
                        qualifiziert: false
                    });
                    await form.save();
                    console.log(`✅ Form ${taskId} created from ClickUp webhook`);
                }
                break;
                
            case 'taskDeleted':
                // Optionally handle task deletion (mark as archived, etc.)
                console.log(`Task ${event.task_id} was deleted in ClickUp`);
                break;
                
            default:
                console.log(`Unhandled event type: ${event.event}`);
        }
        
        // Always respond with success to ClickUp
        res.status(200).json({ message: 'Webhook event processed successfully' });
    } catch (error) {
        console.error('❌ Error processing ClickUp webhook:', error.message);
        // Still return 200 to ClickUp (they expect this)
        res.status(200).json({ message: 'Webhook received with errors' });
    }
};

// Sync all forms with ClickUp (admin function)
exports.syncAllWithClickUp = async (req, res) => {
    try {
        const forms = await Form.find();
        
        const results = {
            total: forms.length,
            successful: 0,
            failed: 0,
            errors: []
        };
        
        // Process forms sequentially to avoid rate limits
        for (const form of forms) {
            try {
                await clickupUtils.syncFormToClickUp(form);
                results.successful++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    taskId: form.taskId,
                    error: error.message
                });
            }
        }
        
        res.json({
            message: 'Synchronisierung abgeschlossen',
            results
        });
    } catch (error) {
        console.error('❌ Fehler bei der Synchronisierung aller Formulare:', error.message);
        res.status(500).json({ 
            message: 'Fehler bei der Synchronisierung', 
            error: error.message 
        });
    }
};