import express from 'express';
import Form from '../models/Form.js';

const router = express.Router();

// Get all forms
router.get('/', async (req, res) => {
    try {
        const forms = await Form.find().sort({ createdAt: -1 });
        res.json(forms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single form
router.get('/:id', async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);
        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }
        res.json(form);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new form
router.post('/', async (req, res) => {
    try {
        const form = new Form(req.body);
        const newForm = await form.save();
        res.status(201).json(newForm);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a form
router.put('/:id', async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);
        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }
        Object.assign(form, req.body);
        const updatedForm = await form.save();
        res.json(updatedForm);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a form
router.delete('/:id', async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);
        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }
        await form.deleteOne();
        res.json({ message: 'Form deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router; 