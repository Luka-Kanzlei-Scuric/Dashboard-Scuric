
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPfaendungsbetrag } from '../lib/pfaendungsberechnung';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://privatinsolvenz-backend.onrender.com';

const ErrorDisplay = ({ error }) => (
    <div className="p-4 bg-red-100 text-red-700 rounded">
        <h2 className="font-bold">Fehler beim Laden des Formulars:</h2>
        <pre className="mt-2">{error.message}</pre>
    </div>
);

const PrivatinsolvenzFormular = () => {
    const { taskId } = useParams();
    console.log("🔍 TaskId aus URL:", taskId);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        taskId: '',
        leadName: '',
        familienstand: '',
        strasse: '',
        hausnummer: '',
        wohnort: '',
        plz: '',
        kinderAnzahl: '',
        kinderAlter: '',
        unterhaltspflicht: '',
        unterhaltHoehe: '',
        beschaeftigungsArt: '',
        befristet: false,
        selbststaendig: false,
        rechtsform: '',
        nettoEinkommen: '',
        zusatzEinkommen: '',
        immobilien: false,
        immobilienDetails: '',
        bankguthaben: '',
        fahrzeuge: false,
        fahrzeugWert: '',
        lebensversicherung: false,
        versicherungWert: '',
        sonstigeVermoegen: '',
        gesamtSchulden: '',
        glaeubiger: '',
        forderungenOeffentlich: '',
        forderungenPrivat: '',
        vorherigeInsolvenz: false,
        insolvenzDatum: '',
        aktuelePfaendung: false,
        pfaendungDetails: '',
        ratenzahlungMonate: '2',
        benutzerdefinierteMonate: '',
        bearbeitungStart: '1', // Standardwert: 1. des Monats
        abrechnungStart: '1',   // Standardwert: 1. des Monats
        notizen: ''
    });

    const [checklist, setChecklist] = useState({
        vorstellung: false,
        leadAbgleich: false,
        vollmachtGeprueft: false,
        zeitVerfuegbar: false,
        einleitung: false
    });

    const loadFormData = async (taskId) => {
        setIsLoading(true);
        try {
            console.group('LoadFormData Debug');
            console.log('TaskId:', taskId);
            console.log('Backend URL:', BACKEND_URL);

            try {
                const response = await fetch(`${BACKEND_URL}/api/forms/${taskId}`);
                console.log('Response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Received data:', data);
                    
                    if (!data.taskId) {
                        console.warn('Warning: Received data has no taskId', data);
                    }
                    
                    setFormData(prevState => ({
                        ...prevState,
                        ...data,
                        taskId: data.taskId || taskId
                    }));
                    setOriginalData(data);
                    
                    setIsLoading(false);
                    console.groupEnd();
                    return;
                }
            } catch (apiError) {
                console.error("API error:", apiError);
            }
            
            // Fallback to mock data for testing
            console.log("Using mock form data");
            const mockData = {
                taskId: taskId || "MOCK001",
                leadName: "Test Mandant",
                familienstand: "ledig",
                strasse: "Musterstraße",
                hausnummer: "123",
                wohnort: "Berlin",
                plz: "10115",
                kinderAnzahl: "0",
                beschaeftigungsArt: "angestellt",
                nettoEinkommen: "2500",
                gesamtSchulden: "15000",
                glaeubiger: "3",
                qualifiziert: false,
                phase: "erstberatung",
                phaseStatus: "Neue Anfrage"
            };
            
            setFormData(prevState => ({
                ...prevState,
                ...mockData
            }));
            setOriginalData(mockData);
            
            console.groupEnd();
        } catch (error) {
            console.error('Error in loadFormData:', error);
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (taskId) {
            loadFormData(taskId);
        }
    }, [taskId]);

    const calculatePrice = () => {
        const nettoEinkommen = parseFloat(formData.nettoEinkommen) || 0;
        const kinderAnzahl = parseInt(formData.kinderAnzahl) || 0;
        const anzahlGlaeubiger = parseInt(formData.glaeubiger) || 0;

        // Basis-Preis Berechnung
        const startgebuehr = 799;
        const preisProGlaeubiger = 39;
        const basisPreis = startgebuehr + (anzahlGlaeubiger * preisProGlaeubiger);

        // Pfändungspreis Berechnung
        const pfaendungsPreis = getPfaendungsbetrag(nettoEinkommen, kinderAnzahl);

        // Ermittle den höheren Preis
        const gesamtPreis = Math.max(basisPreis, pfaendungsPreis || 0);

        return {
            startgebuehr,
            glaeubigerKosten: anzahlGlaeubiger * preisProGlaeubiger,
            pfaendungsPreis: pfaendungsPreis || 0,
            gesamtPreis,
            berechnungsArt: pfaendungsPreis > basisPreis ? 'Pfändungsberechnung' : 'Standardberechnung'
        };
    };

    const calculateRates = () => {
        const gesamtPreis = calculatePrice().gesamtPreis;
        let monate;

        if (formData.ratenzahlungMonate === 'custom') {
            monate = parseInt(formData.benutzerdefinierteMonate) || 1;
            monate = Math.min(Math.max(monate, 1), 12);
        } else {
            monate = parseInt(formData.ratenzahlungMonate) || 2;
        }

        const monatsRate = gesamtPreis / monate;
        return {
            monatsRate,
            gesamtPreis,
            monate
        };
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleChecklistChange = (e) => {
        const { name, checked } = e.target;
        setChecklist(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const saveFormData = async () => {
        setIsSaving(true);
        setSaveError(null);

        try {
            const updatedData = {
                ...formData,
                qualifiziert: true,
                phaseStatus: formData.phaseStatus || 'Neue Anfrage'
            };

            console.log("📤 Sende Daten an Backend:", updatedData);
            const response = await fetch(`${BACKEND_URL}/api/forms/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) throw new Error('Fehler beim Speichern');

            const data = await response.json();
            console.log('✅ Daten erfolgreich gespeichert:', data);

            // Update lokalen State
            setFormData(updatedData);

            // Optional: Nach dem Speichern zur Mandantenliste zurückkehren
            // navigate('/dashboard/erstberatung');

            // Oder zeigen Sie eine Erfolgsmeldung
            alert('Daten erfolgreich gespeichert');
        } catch (error) {
            console.error('❌ Fehler beim Speichern:', error);
            setSaveError('Fehler beim Speichern');
        } finally {
            setIsSaving(false);
        }
    };

    if (error) {
        return <ErrorDisplay error={error} />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Die h1-Überschrift entfernen, da diese im Dashboard bereits angezeigt wird */}

            {isLoading ? (
                <div className="text-center p-4">Lade Formulardaten...</div>
            ) : (
                <>

                    {/* 1. Gesprächseröffnung */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>1. Gesprächseröffnung</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="vorstellung"
                                        checked={checklist.vorstellung}
                                        onChange={handleChecklistChange}
                                        className="h-4 w-4"
                                    />
                                    <span>Eigene Vorstellung durchgeführt</span>
                                </label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            name="leadAbgleich"
                                            checked={checklist.leadAbgleich}
                                            onChange={handleChecklistChange}
                                            className="h-4 w-4"
                                        />
                                        <span>Lead-Daten abgeglichen</span>
                                    </label>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            name="leadName"
                                            value={formData.leadName}
                                            onChange={handleInputChange}
                                            placeholder="Name des Leads"
                                            className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" />
                                    </div>
                                </div>
                                
                                <div className="mt-4">
                                    <label className="block mb-2 font-medium">Status</label>
                                    <select
                                        name="phaseStatus"
                                        value={formData.phaseStatus || ''}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"
                                    >
                                        <option value="Neue Anfrage">Neue Anfrage</option>
                                        <option value="Versucht zu erreichen 1">Versucht zu erreichen 1</option>
                                        <option value="Versucht zu erreichen 2">Versucht zu erreichen 2</option>
                                        <option value="Versucht zu erreichen 3">Versucht zu erreichen 3</option>
                                        <option value="Versucht zu erreichen 4">Versucht zu erreichen 4</option>
                                        <option value="Versucht zu erreichen 5">Versucht zu erreichen 5</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Persönliche Daten */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>2. Persönliche Daten</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Erste Zeile */}
                                <div>
                                    <label className="block mb-2">Familienstand</label>
                                    <select
                                        name="familienstand"
                                        value={formData.familienstand}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"                            >
                                        <option value="">Bitte wählen</option>
                                        <option value="ledig">Ledig</option>
                                        <option value="verheiratet">Verheiratet</option>
                                        <option value="geschieden">Geschieden</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-2">Anzahl Kinder</label>
                                    <input
                                        type="number"
                                        name="kinderAnzahl"
                                        value={formData.kinderAnzahl}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" />
                                </div>
                                <div>
                                    <label className="block mb-2">Alter der Kinder</label>
                                    <input
                                        type="text"
                                        name="kinderAlter"
                                        value={formData.kinderAlter}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" placeholder="z.B.: 4, 7, 12"
                                    />
                                </div>

                                {/* Zweite Zeile */}
                                <div className="md:col-span-2">
                                    <label className="block mb-2">Straße</label>
                                    <input
                                        type="text"
                                        name="strasse"
                                        value={formData.strasse}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" />
                                </div>
                                <div>
                                    <label className="block mb-2">Hausnummer</label>
                                    <input
                                        type="text"
                                        name="hausnummer"
                                        value={formData.hausnummer}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" />
                                </div>

                                {/* Dritte Zeile */}
                                <div className="md:col-span-2">
                                    <label className="block mb-2">Wohnort</label>
                                    <input
                                        type="text"
                                        name="wohnort"
                                        value={formData.wohnort}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" />
                                </div>
                                <div>
                                    <label className="block mb-2">PLZ</label>
                                    <input
                                        type="text"
                                        name="plz"
                                        value={formData.plz}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Berufliche Situation */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>3. Berufliche Situation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2">Art der Beschäftigung</label>
                                    <select
                                        name="beschaeftigungsArt"
                                        value={formData.beschaeftigungsArt}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"                            >
                                        <option value="">Bitte wählen</option>
                                        <option value="angestellt">Angestellt</option>
                                        <option value="selbststaendig">Selbstständig</option>
                                        <option value="arbeitslos">Arbeitslos</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-2">Netto-Einkommen</label>
                                    <input
                                        type="number"
                                        name="nettoEinkommen"
                                        value={formData.nettoEinkommen}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" />
                                </div>
                            </div>

                            {formData.beschaeftigungsArt === 'selbststaendig' && (
                                <Alert className="mt-4" variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        ACHTUNG: Bei Selbstständigkeit Rechtsform genau prüfen!
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* 4. Vermögenssituation */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>4. Vermögenssituation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            name="immobilien"
                                            checked={formData.immobilien}
                                            onChange={handleInputChange}
                                            className="h-4 w-4"
                                        />
                                        <span>Immobilienbesitz vorhanden</span>
                                    </label>
                                    {formData.immobilien && (
                                        <input
                                            type="text"
                                            name="immobilienDetails"
                                            value={formData.immobilienDetails}
                                            onChange={handleInputChange}
                                            placeholder="Details zum Immobilienbesitz"
                                            className="w-full mt-2 p-2 border rounded"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block mb-2">Bankguthaben</label>
                                    <input
                                        type="number"
                                        name="bankguthaben"
                                        value={formData.bankguthaben}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 5. Schuldensituation */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>5. Schuldensituation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2">Gesamtschuldenhöhe</label>
                                    <input
                                        type="number"
                                        name="gesamtSchulden"
                                        value={formData.gesamtSchulden}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" />
                                </div>
                                <div>
                                    <label className="block mb-2">Anzahl Gläubiger</label>
                                    <input
                                        type="number"
                                        name="glaeubiger"
                                        value={formData.glaeubiger}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" />
                                </div>
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            name="vorherigeInsolvenz"
                                            checked={formData.vorherigeInsolvenz}
                                            onChange={handleInputChange}
                                            className="h-4 w-4"
                                        />
                                        <span>Vorherige Insolvenz</span>
                                    </label>
                                    {formData.vorherigeInsolvenz && (
                                        <Alert className="mt-2" variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                ACHTUNG: 10-Jahres-Sperrfrist beachten!
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 6. Ausschlusskriterien */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>6. Ausschlusskriterien prüfen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {formData.glaeubiger > 25 && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                            ACHTUNG: Gläubigeranzahl überschreitet Maximum!
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {formData.vorherigeInsolvenz && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                            ACHTUNG: Vorherige Insolvenz - Sperrfrist prüfen!
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {formData.immobilien && (
                                    <Alert variant="warning">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                            ACHTUNG: Immobiliensituation muss geklärt werden!
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 7. Preiskalkulation als letzter Abschnitt */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>7. Preiskalkulation & Zahlungsoptionen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Preisberechnungsmodus Auswahl */}
                                <div className="mb-4">
                                    <h3 className="font-medium mb-3">Berechnungsmodus</h3>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <div className="p-2">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                            ${!formData.manuellerPreis ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        manuellerPreis: false
                                                    }))}
                                                >
                                                    {!formData.manuellerPreis && (
                                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <span>Automatische Berechnung</span>
                                        </label>

                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <div className="p-2">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                            ${formData.manuellerPreis ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        manuellerPreis: true
                                                    }))}
                                                >
                                                    {formData.manuellerPreis && (
                                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <span>Manueller Preis</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Preisübersicht - nur zeigen, wenn nicht manueller Modus */}
                                {!formData.manuellerPreis ? (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-medium mb-3">Kostenaufstellung</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Standardberechnung */}
                                            <div className="col-span-2 mt-2 mb-2 pt-2 border-t border-gray-200">
                                                <div className="font-semibold">Standardberechnung:</div>
                                            </div>
                                            <div>Startgebühr Insolvenz:</div>
                                            <div className="text-right">{calculatePrice().startgebuehr.toFixed(2)} €</div>
                                            <div>Kosten für {formData.glaeubiger || 0} Gläubiger:</div>
                                            <div className="text-right">{calculatePrice().glaeubigerKosten.toFixed(2)} €</div>
                                            <div className="font-medium">Standardpreis:</div>
                                            <div className="text-right font-medium">{(calculatePrice().startgebuehr + calculatePrice().glaeubigerKosten).toFixed(2)} €</div>

                                            {/* Pfändungsberechnung */}
                                            <div className="col-span-2 mt-4 mb-2 pt-2 border-t border-gray-200">
                                                <div className="font-semibold">Pfändungsberechnung:</div>
                                            </div>
                                            <div>Monatlich pfändbar:</div>
                                            <div className="text-right">{(calculatePrice().pfaendungsPreis / 3).toFixed(2)} €</div>
                                            <div>Pfändbar für 3 Monate:</div>
                                            <div className="text-right">{calculatePrice().pfaendungsPreis.toFixed(2)} €</div>

                                            {/* Gesamtpreis */}
                                            <div className="col-span-2 mt-4 pt-2 border-t border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <div className="font-bold">Gesamtpreis (der höhere Betrag):</div>
                                                    <div className="text-right font-bold text-lg">{calculatePrice().gesamtPreis.toFixed(2)} €</div>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-2">
                                                    Berechnung basierend auf: {calculatePrice().berechnungsArt}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-medium mb-3">Manueller Preis</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block mb-2">Gesamtpreis (€)</label>
                                                <input
                                                    type="number"
                                                    name="manuellerPreisBetrag"
                                                    value={formData.manuellerPreisBetrag || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Betrag eingeben"
                                                    className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-2">Begründung / Notiz</label>
                                                <textarea
                                                    name="manuellerPreisNotiz"
                                                    value={formData.manuellerPreisNotiz || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Grund für manuellen Preis eingeben"
                                                    className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400 min-h-[80px]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Ratenzahlungsrechner - funktioniert mit beiden Preisberechnungsmethoden */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="font-medium mb-3">Ratenzahlung</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block mb-2">Gewünschte Laufzeit</label>
                                            <select
                                                name="ratenzahlungMonate"
                                                value={formData.ratenzahlungMonate}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"
                                            >
                                                <option value="2">2 Monate</option>
                                                <option value="4">4 Monate</option>
                                                <option value="6">6 Monate</option>
                                                <option value="custom">Benutzerdefiniert</option>
                                            </select>
                                        </div>

                                        {formData.ratenzahlungMonate === 'custom' && (
                                            <div>
                                                <label className="block mb-2">Anzahl der Monate (1-12)</label>
                                                <input
                                                    type="number"
                                                    name="benutzerdefinierteMonate"
                                                    value={formData.benutzerdefinierteMonate || ''}
                                                    onChange={handleInputChange}
                                                    min="1"
                                                    max="12"
                                                    className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"
                                                    placeholder="Anzahl der Monate eingeben"
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded mt-4">
                                            <div>Monatliche Rate:</div>
                                            <div className="text-right font-bold">
                                                {formData.manuellerPreis
                                                    ? ((parseFloat(formData.manuellerPreisBetrag) || 0) / (calculateRates().monate)).toFixed(2)
                                                    : calculateRates().monatsRate.toFixed(2)} €
                                            </div>

                                            <div>Laufzeit:</div>
                                            <div className="text-right">{calculateRates().monate} Monate</div>

                                            <div>Gesamtbetrag:</div>
                                            <div className="text-right">
                                                {formData.manuellerPreis
                                                    ? (parseFloat(formData.manuellerPreisBetrag) || 0).toFixed(2)
                                                    : calculateRates().gesamtPreis.toFixed(2)} €
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Alert>
                                    <AlertDescription>
                                        Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
                                        {!formData.manuellerPreis
                                            ? ' Die Berechnung basiert auf einer Startgebühr von 799€ plus 39€ pro Gläubiger.'
                                            : ' Ein manueller Preis wurde festgelegt.'}
                                        Die Ratenzahlung ist zinslos.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Zustellungsart */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>8. Zustellungsart des Angebots</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex space-x-8 justify-center">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <div className="p-3"> {/* Padding auf p-3 erhöht für größeren Klickbereich */}
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${formData.zustellungPost ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                zustellungPost: !prev.zustellungPost
                                            }))}
                                        >
                                            {formData.zustellungPost && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span>Per Post</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <div className="p-3"> {/* Padding auf p-3 erhöht für größeren Klickbereich */}
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${formData.zustellungEmail ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                zustellungEmail: !prev.zustellungEmail
                                            }))}
                                        >
                                            {formData.zustellungEmail && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span>Per E-Mail</span>
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Startdatum für Bearbeitung/Abrechnung */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>9. Startdatum für Bearbeitung und Abrechnung</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Abrechnungsstart */}
                                <div>
                                    <h3 className="font-medium mb-3">Bearbeitung starten:</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block mb-2">Tag</label>
                                            <div className="flex items-center gap-8">
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <div className="p-3">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                    ${formData.bearbeitungStart === '1' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                bearbeitungStart: '1'
                                                            }))}
                                                        >
                                                            {formData.bearbeitungStart === '1' && (
                                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span>zum 1.</span>
                                                </label>

                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <div className="p-3">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                    ${formData.bearbeitungStart === '15' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                bearbeitungStart: '15'
                                                            }))}
                                                        >
                                                            {formData.bearbeitungStart === '15' && (
                                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span>zum 15.</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block mb-2">Monat</label>
                                            <select
                                                name="bearbeitungMonat"
                                                value={formData.bearbeitungMonat || ''}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"
                                            >
                                                <option value="">Aktueller Monat</option>
                                                <option value="1">Januar</option>
                                                <option value="2">Februar</option>
                                                <option value="3">März</option>
                                                <option value="4">April</option>
                                                <option value="5">Mai</option>
                                                <option value="6">Juni</option>
                                                <option value="7">Juli</option>
                                                <option value="8">August</option>
                                                <option value="9">September</option>
                                                <option value="10">Oktober</option>
                                                <option value="11">November</option>
                                                <option value="12">Dezember</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Abrechnungsstart */}
                                <div>
                                    <h3 className="font-medium mb-3">Abrechnung starten:</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block mb-2">Tag</label>
                                            <div className="flex items-center gap-8">
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <div className="p-3">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                    ${formData.abrechnungStart === '1' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                abrechnungStart: '1'
                                                            }))}
                                                        >
                                                            {formData.abrechnungStart === '1' && (
                                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span>zum 1.</span>
                                                </label>

                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <div className="p-3">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                    ${formData.abrechnungStart === '15' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                abrechnungStart: '15'
                                                            }))}
                                                        >
                                                            {formData.abrechnungStart === '15' && (
                                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span>zum 15.</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block mb-2">Monat</label>
                                            <select
                                                name="abrechnungMonat"
                                                value={formData.abrechnungMonat || ''}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"
                                            >
                                                <option value="">Aktueller Monat</option>
                                                <option value="1">Januar</option>
                                                <option value="2">Februar</option>
                                                <option value="3">März</option>
                                                <option value="4">April</option>
                                                <option value="5">Mai</option>
                                                <option value="6">Juni</option>
                                                <option value="7">Juli</option>
                                                <option value="8">August</option>
                                                <option value="9">September</option>
                                                <option value="10">Oktober</option>
                                                <option value="11">November</option>
                                                <option value="12">Dezember</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div> {/* Hier wird das äußere div mit className="space-y-6" geschlossen */}
                        </CardContent>
                    </Card>

                    {/* Qualifiziert Button */}
                    <div className="flex justify-center mt-6 mb-8">
                        <button
                            className={`px-6 py-3 ${formData.qualifiziert
                                ? 'bg-gray-500 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600'} 
                                text-white font-semibold rounded-lg transition-colors ${isSaving ? 'opacity-50' : ''}`}
                            onClick={saveFormData}
                            disabled={isSaving || formData.qualifiziert}
                        >
                            {isSaving ? 'Wird gespeichert...' : formData.qualifiziert ? 'Bereits qualifiziert' : 'Qualifiziert'}
                        </button>
                    </div>

                    {saveError && (
                        <div className="text-red-500 text-center mt-2">
                            {saveError}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PrivatinsolvenzFormular;