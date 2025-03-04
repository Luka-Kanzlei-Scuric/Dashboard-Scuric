const mongoose = require('mongoose');

// Define document schema
const documentSchema = new mongoose.Schema({
    name: String,
    type: String,
    uploadDate: String,
    size: String,
    path: String // Path to the file in the storage system
});

// Define checklist schema
const checklistSchema = new mongoose.Schema({
    dokumente: {
        personalausweis: { type: Boolean, default: false },
        meldebescheinigung: { type: Boolean, default: false },
        einkommensnachweise: { type: Boolean, default: false },
        mietvertrag: { type: Boolean, default: false },
        kontoauszuege: { type: Boolean, default: false },
        schuldenUebersicht: { type: Boolean, default: false },
        vermoegenUebersicht: { type: Boolean, default: false }
    },
    beratung: {
        erstgespraechErfolgt: { type: Boolean, default: false },
        aufklaerungErfolgt: { type: Boolean, default: false },
        fragenBeantwortet: { type: Boolean, default: false },
        risikoBesprochen: { type: Boolean, default: false },
        alternativenBesprochen: { type: Boolean, default: false }
    },
    termine: {
        fristEingehalten: { type: Boolean, default: false },
        terminVereinbart: { type: Boolean, default: false },
        mandantInformiert: { type: Boolean, default: false }
    }
});

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
    zustellungPost: {
        type: Boolean,
        default: false
    },
    zustellungEmail: {
        type: Boolean,
        default: false
    },
    qualifiziert: {
        type: Boolean,
        default: false
    },
    // Phase information
    phase: {
        type: String,
        enum: ['erstberatung', 'checkliste', 'dokumente', 'abgeschlossen'],
        default: 'erstberatung'
    },
    // Persönliche Daten
    familienstand: String,
    strasse: String,
    hausnummer: String,
    wohnort: String,
    plz: String,
    kinderAnzahl: String,
    kinderAlter: String,
    unterhaltspflicht: String,
    unterhaltHoehe: String,
    beschaeftigungsArt: String,
    befristet: Boolean,
    selbststaendig: Boolean,
    rechtsform: String,
    nettoEinkommen: String,
    zusatzEinkommen: String,
    immobilien: Boolean,
    immobilienDetails: String,
    bankguthaben: String,
    fahrzeuge: Boolean,
    fahrzeugWert: String,
    lebensversicherung: Boolean,
    versicherungWert: String,
    sonstigeVermoegen: String,
    gesamtSchulden: String,
    glaeubiger: String,
    forderungenOeffentlich: String,
    forderungenPrivat: String,
    vorherigeInsolvenz: Boolean,
    insolvenzDatum: String,
    aktuelePfaendung: Boolean,
    pfaendungDetails: String,
    ratenzahlungMonate: String,
    benutzerdefinierteMonate: String,
    bearbeitungStart: {
        type: String,
        default: '1'
    },
    bearbeitungMonat: {
        type: String,
        default: ''
    },
    abrechnungStart: {
        type: String,
        default: '1'
    },
    abrechnungMonat: {
        type: String,
        default: ''
    },
    manuellerPreis: {
        type: Boolean,
        default: false
    },
    manuellerPreisBetrag: {
        type: String,
        default: ''
    },
    manuellerPreisNotiz: {
        type: String,
        default: ''
    },
    // New fields for dashboard functionality
    checklist: {
        type: checklistSchema,
        default: () => ({})
    },
    documents: [documentSchema],
    notizen: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Form', formSchema);