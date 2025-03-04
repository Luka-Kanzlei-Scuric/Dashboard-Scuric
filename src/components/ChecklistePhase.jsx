// src/components/ChecklistePhase.jsx
import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Save, AlertTriangle, Check, Clock } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://privatinsolvenz-backend.onrender.com';

const ChecklistePhase = () => {
    const { taskId } = useParams();
    const [clientData, setClientData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Checklist state
    const [checklist, setChecklist] = useState({
        backoffice: {
            ablaufKommunikation: false,
            schufaVollstreckungPortal: false,
            ratenzahlungsplan: false,
            glaeubigerInformationen: false,
            personalbogen: false,
            arbeitgeber: false,
            pKontoAntrag: false,
            datenuebertragung: false,
            insolvenzverwalter: false,
            versandAkte: false
        }
    });

    // Load client data
    useEffect(() => {
        if (taskId) {
            loadClientData(taskId);
        }
    }, [taskId]);

    const loadClientData = async (taskId) => {
        setIsLoading(true);
        try {
            console.log("Fetching client data from:", `${BACKEND_URL}/api/forms/${taskId}`);
            
            // Fallback to mock data for testing
            console.log("Using mock client data");
            const mockData = {
                taskId: taskId || "MOCK001",
                leadName: "Test Mandant",
                phase: "checkliste",
                phaseStatus: "Angebot unterschrieben",
                qualifiziert: true,
                glaeubiger: "5",
                gesamtSchulden: "25000",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            setClientData(mockData);
            
        } catch (error) {
            console.error("Error loading client data:", error);
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle checklist item change
    const handleChecklistChange = (section, item) => {
        setChecklist(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [item]: !prev[section][item]
            }
        }));
    };

    // Calculate progress for each section
    const calculateProgress = (section) => {
        if (!checklist || !checklist[section]) return 0;
        const items = Object.values(checklist[section]);
        if (items.length === 0) return 0;
        const completed = items.filter(item => item).length;
        return Math.round((completed / items.length) * 100);
    };

    // Save checklist data
    const saveChecklist = async () => {
        setIsSaving(true);
        try {
            // Update the client data with the checklist and status
            const updatedData = {
                ...clientData,
                checklist: checklist,
                phaseStatus: clientData.phaseStatus || 'Angebotszustellung'
            };
            
            const response = await fetch(`${BACKEND_URL}/api/forms/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            
            if (!response.ok) {
                throw new Error("Fehler beim Speichern der Checkliste");
            }
            
            // Success message
            alert("Checkliste erfolgreich gespeichert");
            
        } catch (error) {
            console.error("Error saving checklist:", error);
            alert("Fehler beim Speichern: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Daten werden geladen...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Fehler beim Laden der Daten: {error.message}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Client Info Header */}
            <div className="bg-white rounded-xl shadow-md p-5 mb-6">
                <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-[#f5e6e6] flex items-center justify-center text-[#9c1b1c] font-medium mr-4">
                        {clientData?.leadName ? clientData.leadName.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{clientData?.leadName || 'Mandant'}</h2>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm">
                            <div><span className="text-gray-500 font-medium">Aktenzeichen:</span> {clientData?.taskId}</div>
                            <div><span className="text-gray-500 font-medium">Schulden:</span> {clientData?.gesamtSchulden ? `${clientData.gesamtSchulden}€` : 'Nicht angegeben'}</div>
                            {clientData?.phaseStatus && (
                                <div><span className="text-gray-500 font-medium">Status:</span> {clientData.phaseStatus}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status & Save Button */}
            <div className="flex justify-between items-center mb-6">
                <div className="w-1/3">
                    <label className="block mb-2 font-medium">Status</label>
                    <select
                        name="phaseStatus"
                        value={clientData?.phaseStatus || ''}
                        onChange={(e) => setClientData({...clientData, phaseStatus: e.target.value})}
                        className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"
                    >
                        <option value="Angebotszustellung">Angebotszustellung</option>
                        <option value="Angebot unterschrieben">Angebot unterschrieben</option>
                    </select>
                </div>
                
                <button 
                    onClick={saveChecklist}
                    disabled={isSaving}
                    className={`flex items-center px-5 py-2.5 ${isSaving ? 'bg-gray-400' : 'bg-[#9c1b1c] hover:bg-[#7e1617]'} text-white rounded-lg transition-colors duration-200 shadow-sm`}
                >
                    <Save className="h-5 w-5 mr-2" />
                    {isSaving ? 'Wird gespeichert...' : 'Checkliste speichern'}
                </button>
            </div>

            {/* Checkliste Section */}
            <div className="space-y-6">
                {/* Insolvenzprozess Checkliste */}
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow rounded-xl border border-gray-100">
                    <CardHeader className="pb-2 border-b border-gray-100">
                        <CardTitle className="flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#9c1b1c] text-white mr-3">1</span>
                                <span>Insolvenzprozess Checkliste</span>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-2">
                            {Object.entries(checklist.backoffice).map(([key, value]) => (
                                <div 
                                    key={key} 
                                    className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                                        value ? 'bg-[#f5e6e6] border border-[#e8c5c5]' : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                                    }`}
                                >
                                    <input 
                                        type="checkbox"
                                        id={`back-${key}`}
                                        checked={value}
                                        onChange={() => handleChecklistChange('backoffice', key)}
                                        className="h-5 w-5 rounded-md border-gray-300 text-[#9c1b1c] focus:ring-[#9c1b1c]"
                                    />
                                    <label htmlFor={`back-${key}`} className="ml-3 cursor-pointer flex-1 font-medium">
                                        {key === 'ablaufKommunikation' && 'Ablauf im Backoffice und Kommunikation'}
                                        {key === 'schufaVollstreckungPortal' && 'Link für Schufa und Vollstreckungs-Portal zusenden'}
                                        {key === 'ratenzahlungsplan' && 'Ratenzahlungsplan'}
                                        {key === 'glaeubigerInformationen' && 'Gläubigerinformationen'}
                                        {key === 'personalbogen' && 'Personalbogen'}
                                        {key === 'arbeitgeber' && 'Arbeitgeber'}
                                        {key === 'pKontoAntrag' && 'P-Konto Antrag / Bank / Konto'}
                                        {key === 'datenuebertragung' && 'Datenübertragung / Unterlagen (Auswahl für Post und Online)'}
                                        {key === 'insolvenzverwalter' && 'Insolvenzverwalter / Wohlverhaltensphase'}
                                        {key === 'versandAkte' && 'Versand der Akte an Schuldner und Aufgaben / Schufa nach der Insolvenz'}
                                    </label>
                                    {value && <Check className="h-5 w-5 text-[#9c1b1c]" />}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notes Section */}
            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow mt-6 rounded-xl border border-gray-100">
                <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Notizen
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <textarea
                        className="w-full p-4 border border-gray-300 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Notizen zum Fall hier eintragen..."
                        value={clientData?.notizen || ''}
                        onChange={(e) => setClientData({...clientData, notizen: e.target.value})}
                    ></textarea>
                </CardContent>
            </Card>
        </div>
    );
};

export default ChecklistePhase;