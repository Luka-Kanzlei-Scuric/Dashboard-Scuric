const axios = require('axios');
const Form = require('../models/Form');
const { validationResult } = require('express-validator');
const clickupUtils = require('../utils/clickupUtils');

// Get Form by TaskId
exports.getFormByTaskId = async (req, res) => {
    try {
        console.log(`🔎 Suche nach Formular mit TaskId: ${req.params.taskId}`);
        const form = await Form.findOne({ taskId: req.params.taskId });

        if (!form) {
            console.warn(`⚠ Formular mit TaskId ${req.params.taskId} nicht gefunden`);
            return res.status(404).json({ message: 'Formular nicht gefunden' });
        }

        console.log("✅ Formular gefunden:", form);
        res.json(form);
    } catch (error) {
        console.error("❌ Fehler in getFormByTaskId:", error.stack);
        res.status(500).json({ message: "Interner Serverfehler" });
    }
};

// Create Form
exports.createForm = async (req, res) => {
    try {
        console.log("CreateForm aufgerufen mit:", req.body);

        if (!req.body.taskId) {
            return res.status(400).json({ message: "taskId ist erforderlich!" });
        }

        const existingForm = await Form.findOne({ taskId: req.body.taskId });
        if (existingForm) {
            return res.status(400).json({ message: "Formular existiert bereits" });
        }

        // Formular in MongoDB erstellen
        const form = new Form({
            taskId: req.body.taskId,
            leadName: req.body.leadName,
            phase: 'erstberatung' // Start with the first phase
        });

        const savedForm = await form.save();
        console.log("✅ Formular erfolgreich in MongoDB erstellt:", savedForm);
        
        // Sync with ClickUp
        try {
            await clickupUtils.syncFormToClickUp(savedForm);
            console.log("✅ Neues Formular mit ClickUp synchronisiert");
        } catch (clickupError) {
            console.error("⚠️ ClickUp-Synchronisierung fehlgeschlagen:", clickupError.message);
            // We don't fail the request if ClickUp sync fails
        }

        res.status(201).json({
            message: "Formular erstellt!",
            formURL: `${process.env.FRONTEND_URL}/form/${req.body.taskId}`
        });

    } catch (error) {
        console.error("❌ Fehler beim Erstellen des Formulars:", error.response?.data || error.message);
        res.status(500).json({ message: "Interner Serverfehler", error: error.message });
    }
};

// Update Form
exports.updateForm = async (req, res) => {
    try {
        console.log(`🔄 Update-Request für TaskId ${req.params.taskId}`);

        const updatedForm = await Form.findOneAndUpdate(
            { taskId: req.params.taskId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedForm) {
            console.warn(`⚠ Formular mit TaskId ${req.params.taskId} nicht gefunden`);
            return res.status(404).json({ message: 'Formular nicht gefunden' });
        }

        // Berechne Preise für make.com
        const startgebuehr = 799;
        const preisProGlaeubiger = 39;
        const anzahlGlaeubiger = parseInt(updatedForm.glaeubiger) || 0;
        const gesamtPreis = startgebuehr + (anzahlGlaeubiger * preisProGlaeubiger);

        // Berechne Raten
        let monate = updatedForm.ratenzahlungMonate === 'custom'
            ? Math.min(Math.max(parseInt(updatedForm.benutzerdefinierteMonate) || 1, 1), 12)
            : parseInt(updatedForm.ratenzahlungMonate) || 2;
        const monatsRate = gesamtPreis / monate;

        // Automatically update phase if not specified
        if (updatedForm.qualifiziert && !req.body.phase && updatedForm.phase === 'erstberatung') {
            updatedForm.phase = 'checkliste';
            await updatedForm.save();
        }

        // Sende Daten an make.com
        try {
            const makeWebhookUrl = 'https://hook.eu2.make.com/wm49imwg7p08738f392n8pu2hgwwzpac';
            await axios.post(makeWebhookUrl, {
                ...updatedForm.toObject(),
                preisKalkulation: {
                    berechnungsart: updatedForm.manuellerPreis ? 'manuell' :
                        (calculatedPfandungsPrice > calculatedStandardPrice ? 'nach Pfändung' : 'nach Gläubiger'),
                    manuell: updatedForm.manuellerPreis || false,
                    manuellerPreisBetrag: updatedForm.manuellerPreisBetrag || "",
                    manuellerPreisNotiz: updatedForm.manuellerPreisNotiz || "",
                    startgebuehr,
                    preisProGlaeubiger,
                    anzahlGlaeubiger,
                    gesamtPreis,
                    ratenzahlung: {
                        monate,
                        monatsRate
                    }
                },
                zustellung: {
                    perPost: updatedForm.zustellungPost,
                    perEmail: updatedForm.zustellungEmail
                },
                terminierung: {
                    bearbeitungStart: updatedForm.bearbeitungStart,
                    bearbeitungMonat: updatedForm.bearbeitungMonat,
                    abrechnungStart: updatedForm.abrechnungStart,
                    abrechnungMonat: updatedForm.abrechnungMonat
                },
                qualifizierungsStatus: updatedForm.qualifiziert
            });
            console.log("✅ Daten an make.com gesendet");
        } catch (makeError) {
            console.error("⚠️ Make.com Update fehlgeschlagen:", makeError.message);
        }

        console.log("✅ Formular erfolgreich aktualisiert:", updatedForm);
        
        // Sync with ClickUp
        try {
            await clickupUtils.syncFormToClickUp(updatedForm);
            console.log("✅ Formular mit ClickUp synchronisiert");
        } catch (clickupError) {
            console.error("⚠️ ClickUp-Synchronisierung fehlgeschlagen:", clickupError.message);
            // We don't fail the request if ClickUp sync fails
        }
        
        res.json(updatedForm);
    } catch (error) {
        console.error("❌ Fehler beim Aktualisieren des Formulars:", error);
        res.status(500).json({ message: "Interner Serverfehler" });
    }
};

// Get All Forms / Clients
exports.getAllForms = async (req, res) => {
    try {
        console.log("🔎 Anfrage für alle Formulare erhalten");

        // Optional: Pagination hinzufügen
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build filter based on query parameters
        const filter = {};
        
        // Filter by qualification status
        if (req.query.qualifiziert === 'true') {
            filter.qualifiziert = true;
        } else if (req.query.qualifiziert === 'false') {
            filter.qualifiziert = false;
        }
        
        // Filter by phase
        if (req.query.phase && ['erstberatung', 'checkliste', 'dokumente', 'abgeschlossen'].includes(req.query.phase)) {
            filter.phase = req.query.phase;
        }
        
        // Search by name
        if (req.query.search) {
            filter.leadName = { $regex: req.query.search, $options: 'i' };
        }

        console.log("Executing query with filter:", filter);
        
        try {
            // Holen Sie nur die wichtigsten Felder für die Übersicht
            const forms = await Form.find(filter)
                .select('taskId leadName qualifiziert phase glaeubiger gesamtSchulden createdAt updatedAt')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Form.countDocuments(filter);

            console.log(`✅ ${forms.length} Formulare gefunden`);

            // Even if no forms are found, return a successful response with empty array
            res.json({
                forms: forms || [],
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (dbError) {
            console.error("Database error:", dbError);
            
            // Gib leere Liste zurück anstatt Test-Daten
            console.log("Fehler bei der Datenbankabfrage - Leere Liste zurückgeben");
            res.status(500).json({
                success: false,
                message: 'Fehler bei der Datenbankabfrage',
                error: dbError.message
            });
        }
    } catch (error) {
        console.error("❌ Fehler in getAllForms:", error.stack);
        
        // Bei allgemeinem Fehler ebenfalls Fehlermeldung
        res.status(500).json({
            success: false, 
            message: "Fehler beim Laden der Mandanten",
            error: error.message
        });
    }
};

// Update client phase
exports.updateClientPhase = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { phase } = req.body;
        
        if (!phase || !['erstberatung', 'checkliste', 'dokumente', 'abgeschlossen'].includes(phase)) {
            return res.status(400).json({ message: 'Ungültige Phase' });
        }
        
        const updatedForm = await Form.findOneAndUpdate(
            { taskId },
            { phase },
            { new: true }
        );
        
        if (!updatedForm) {
            return res.status(404).json({ message: 'Formular nicht gefunden' });
        }
        
        // Sync with ClickUp after phase update
        try {
            await clickupUtils.syncFormToClickUp(updatedForm);
            console.log("✅ Phasenänderung mit ClickUp synchronisiert");
        } catch (clickupError) {
            console.error("⚠️ ClickUp-Synchronisierung der Phase fehlgeschlagen:", clickupError.message);
            // We don't fail the request if ClickUp sync fails
        }
        
        res.json({ message: 'Phase aktualisiert', form: updatedForm });
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Phase:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
};

// Add document metadata to a client (document upload would be handled separately)
exports.addDocument = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { name, type, size, path } = req.body;
        
        if (!name || !type) {
            return res.status(400).json({ message: 'Name und Typ sind erforderlich' });
        }
        
        const document = {
            name,
            type,
            uploadDate: new Date().toISOString().split('T')[0],
            size: size || '0 KB',
            path: path || ''
        };
        
        const updatedForm = await Form.findOneAndUpdate(
            { taskId },
            { $push: { documents: document } },
            { new: true }
        );
        
        if (!updatedForm) {
            return res.status(404).json({ message: 'Formular nicht gefunden' });
        }
        
        res.status(201).json({ 
            message: 'Dokument hinzugefügt', 
            document: updatedForm.documents[updatedForm.documents.length - 1] 
        });
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen des Dokuments:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
};

// Remove document
exports.removeDocument = async (req, res) => {
    try {
        const { taskId, documentId } = req.params;
        
        const updatedForm = await Form.findOneAndUpdate(
            { taskId },
            { $pull: { documents: { _id: documentId } } },
            { new: true }
        );
        
        if (!updatedForm) {
            return res.status(404).json({ message: 'Formular oder Dokument nicht gefunden' });
        }
        
        res.json({ message: 'Dokument entfernt' });
    } catch (error) {
        console.error('❌ Fehler beim Entfernen des Dokuments:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
};
