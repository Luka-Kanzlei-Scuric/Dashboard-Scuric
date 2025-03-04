// src/components/DokumentePhase.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Trash2, AlertTriangle, File, FilePlus, Clock, Search } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://privatinsolvenz-backend.onrender.com';

// Mock file list for demonstration purposes
const MOCK_FILES = [
    { id: '1', name: 'Personalausweis.pdf', type: 'Identitätsnachweis', uploadDate: '2024-02-10', size: '1.2 MB' },
    { id: '2', name: 'Mietvertrag.pdf', type: 'Vertrag', uploadDate: '2024-02-10', size: '2.4 MB' },
    { id: '3', name: 'Gehaltsabrechnung_Januar.pdf', type: 'Einkommensnachweis', uploadDate: '2024-02-15', size: '0.8 MB' },
    { id: '4', name: 'Kontoauszug_Januar.pdf', type: 'Finanzdokument', uploadDate: '2024-02-15', size: '1.5 MB' }
];

const DOCUMENT_TYPES = [
    { value: 'identity', label: 'Identitätsnachweis' },
    { value: 'income', label: 'Einkommensnachweis' },
    { value: 'contract', label: 'Vertrag' },
    { value: 'financial', label: 'Finanzdokument' },
    { value: 'correspondence', label: 'Korrespondenz' },
    { value: 'other', label: 'Sonstiges' }
];

const DokumentePhase = () => {
    const { taskId } = useParams();
    const [clientData, setClientData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Document management state
    const [documents, setDocuments] = useState([]);
    const [selectedDocType, setSelectedDocType] = useState('');
    
    // UI state
    const [activeTab, setActiveTab] = useState('documents'); // documents, data, templates
    const [uploadingFile, setUploadingFile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Load client data
    useEffect(() => {
        if (taskId) {
            loadClientData(taskId);
            
            // For demonstration, load mock files
            setDocuments(MOCK_FILES);
        }
    }, [taskId]);

    const loadClientData = async (taskId) => {
        setIsLoading(true);
        try {
            console.log("Fetching client data from:", `${BACKEND_URL}/api/forms/${taskId}`);
            
            try {
                const response = await fetch(`${BACKEND_URL}/api/forms/${taskId}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Client data received:", data);
                    setClientData(data);
                    
                    // If there are documents in client data, load them
                    if (data.documents && data.documents.length > 0) {
                        setDocuments(data.documents);
                    } else {
                        // Just keep the mock documents we already loaded
                        console.log("No documents in API response, keeping mock data");
                    }
                    
                    setIsLoading(false);
                    return;
                }
            } catch (apiError) {
                console.error("API error:", apiError);
            }
            
            // Fallback to mock data for testing
            console.log("Using mock client data");
            const mockData = {
                taskId: taskId || "MOCK001",
                leadName: "Test Mandant",
                phase: "dokumente",
                qualifiziert: true,
                glaeubiger: "7",
                gesamtSchulden: "35000",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                familienstand: "verheiratet",
                strasse: "Musterstraße",
                hausnummer: "123",
                wohnort: "Berlin",
                plz: "10115",
                kinderAnzahl: "2",
                beschaeftigungsArt: "angestellt",
                nettoEinkommen: "2800"
            };
            
            setClientData(mockData);
            // Keep the mock documents already set in state
            
        } catch (error) {
            console.error("Error loading client data:", error);
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle file upload (mock implementation)
    const handleFileUpload = (e) => {
        e.preventDefault();
        setUploadingFile(true);
        
        // Simulate file upload
        setTimeout(() => {
            const fileInput = document.getElementById('file-upload');
            const files = fileInput.files;
            
            if (files.length > 0) {
                const newDocs = Array.from(files).map((file, index) => ({
                    id: Date.now() + index,
                    name: file.name,
                    type: selectedDocType ? DOCUMENT_TYPES.find(t => t.value === selectedDocType)?.label : 'Sonstiges',
                    uploadDate: new Date().toISOString().split('T')[0],
                    size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
                }));
                
                setDocuments(prev => [...prev, ...newDocs]);
                fileInput.value = '';
                setSelectedDocType('');
            }
            
            setUploadingFile(false);
        }, 1500);
    };

    // Handle file deletion (mock implementation)
    const handleDeleteFile = (fileId) => {
        if (confirm('Sind Sie sicher, dass Sie dieses Dokument löschen möchten?')) {
            setDocuments(prev => prev.filter(doc => doc.id !== fileId));
        }
    };

    // Filter documents based on search term
    const filteredDocuments = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
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
                        <div className="flex gap-4 mt-1 text-sm">
                            <div><span className="text-gray-500 font-medium">Aktenzeichen:</span> {clientData?.taskId}</div>
                            <div><span className="text-gray-500 font-medium">Schulden:</span> {clientData?.gesamtSchulden ? `${clientData.gesamtSchulden}€` : 'Nicht angegeben'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6 gap-2">
                <button 
                    className={`px-5 py-3 font-medium rounded-t-lg transition-all duration-200 ${
                        activeTab === 'documents' 
                            ? 'border-b-2 border-purple-500 bg-purple-50 text-purple-700' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('documents')}
                >
                    Dokumente
                </button>
                <button 
                    className={`px-5 py-3 font-medium rounded-t-lg transition-all duration-200 ${
                        activeTab === 'data' 
                            ? 'border-b-2 border-purple-500 bg-purple-50 text-purple-700' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('data')}
                >
                    Persönliche Daten
                </button>
                <button 
                    className={`px-5 py-3 font-medium rounded-t-lg transition-all duration-200 ${
                        activeTab === 'templates' 
                            ? 'border-b-2 border-purple-500 bg-purple-50 text-purple-700' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('templates')}
                >
                    Vorlagen
                </button>
            </div>

            {/* Documents Tab Content */}
            {activeTab === 'documents' && (
                <>
                    {/* Upload Section */}
                    <Card className="bg-white shadow-md mb-6 rounded-xl border border-gray-100">
                        <CardHeader className="border-b border-gray-100">
                            <CardTitle className="flex items-center">
                                <Upload className="h-5 w-5 mr-2 text-purple-600" />
                                Dokument hochladen
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <form onSubmit={handleFileUpload} className="space-y-5">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block mb-2 text-sm font-medium text-gray-700">Dokumenttyp</label>
                                        <select 
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all duration-200"
                                            value={selectedDocType}
                                            onChange={(e) => setSelectedDocType(e.target.value)}
                                            required
                                        >
                                            <option value="">Bitte wählen</option>
                                            {DOCUMENT_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block mb-2 text-sm font-medium text-gray-700">Datei auswählen</label>
                                        <div className="relative">
                                            <input 
                                                id="file-upload"
                                                type="file" 
                                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100 transition-all duration-200"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button 
                                        type="submit"
                                        disabled={uploadingFile}
                                        className={`flex items-center px-5 py-2.5 ${uploadingFile ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transition-colors duration-200 shadow-sm`}
                                    >
                                        <Upload className="h-5 w-5 mr-2" />
                                        {uploadingFile ? 'Wird hochgeladen...' : 'Hochladen'}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Documents List */}
                    <Card className="bg-white shadow-md rounded-xl border border-gray-100">
                        <CardHeader className="border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-purple-600" />
                                    Dokumente
                                </CardTitle>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        placeholder="Suchen..."
                                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-64 transition-all duration-200"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {filteredDocuments.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    {searchTerm ? (
                                        <p className="text-gray-500">Keine Dokumente gefunden, die "{searchTerm}" entsprechen.</p>
                                    ) : (
                                        <>
                                            <FilePlus className="h-16 w-16 mx-auto text-gray-300 mb-3" />
                                            <p className="text-gray-500">Keine Dokumente vorhanden.</p>
                                            <p className="text-gray-400 text-sm mt-1">Laden Sie Dokumente hoch, um sie hier anzuzeigen.</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Größe</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Aktionen</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {filteredDocuments.map(doc => (
                                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 mr-3">
                                                                <File className="h-4 w-4" />
                                                            </div>
                                                            <span className="text-sm font-medium">{doc.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{doc.type}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{doc.uploadDate}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{doc.size}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                                        <button 
                                                            className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition-colors duration-200 mx-1"
                                                            title="Herunterladen"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors duration-200 mx-1"
                                                            title="Löschen"
                                                            onClick={() => handleDeleteFile(doc.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Personal Data Tab Content */}
            {activeTab === 'data' && (
                <Card className="bg-white shadow-md">
                    <CardHeader>
                        <CardTitle>Persönliche Daten</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-medium mb-3 text-gray-700">Persönliche Informationen</h3>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Name:</span>
                                        <span className="col-span-2">{clientData?.leadName || '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Familienstand:</span>
                                        <span className="col-span-2">{clientData?.familienstand || '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Kinder:</span>
                                        <span className="col-span-2">{clientData?.kinderAnzahl || '0'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-medium mb-3 text-gray-700">Adresse</h3>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Straße:</span>
                                        <span className="col-span-2">{clientData?.strasse || '-'} {clientData?.hausnummer || ''}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Ort:</span>
                                        <span className="col-span-2">{clientData?.plz || '-'} {clientData?.wohnort || ''}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-medium mb-3 text-gray-700">Berufliche Situation</h3>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Beschäftigung:</span>
                                        <span className="col-span-2">{clientData?.beschaeftigungsArt || '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Einkommen:</span>
                                        <span className="col-span-2">{clientData?.nettoEinkommen ? `${clientData.nettoEinkommen}€` : '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-medium mb-3 text-gray-700">Finanzsituation</h3>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Gesamtschulden:</span>
                                        <span className="col-span-2">{clientData?.gesamtSchulden ? `${clientData.gesamtSchulden}€` : '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-500">Gläubiger:</span>
                                        <span className="col-span-2">{clientData?.glaeubiger || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Templates Tab Content */}
            {activeTab === 'templates' && (
                <Card className="bg-white shadow-md">
                    <CardHeader>
                        <CardTitle>Vorlagen und Formulare</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium mb-3 text-gray-700">Insolvenzantrags-Vorlagen</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 border rounded-md hover:shadow-md transition-shadow">
                                        <div className="flex items-start">
                                            <FileText className="h-6 w-6 text-purple-500 mr-3 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-medium">Insolvenzantrag</h4>
                                                <p className="text-sm text-gray-600 mt-1">Standardvorlage für den Insolvenzantrag</p>
                                                <button className="mt-2 text-sm text-purple-600 flex items-center">
                                                    <Download className="h-3 w-3 mr-1" /> Herunterladen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 border rounded-md hover:shadow-md transition-shadow">
                                        <div className="flex items-start">
                                            <FileText className="h-6 w-6 text-purple-500 mr-3 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-medium">Vermögensübersicht</h4>
                                                <p className="text-sm text-gray-600 mt-1">Formular zur Erfassung des Vermögens</p>
                                                <button className="mt-2 text-sm text-purple-600 flex items-center">
                                                    <Download className="h-3 w-3 mr-1" /> Herunterladen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-medium mb-3 text-gray-700">Korrespondenz</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 border rounded-md hover:shadow-md transition-shadow">
                                        <div className="flex items-start">
                                            <FileText className="h-6 w-6 text-purple-500 mr-3 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-medium">Anschreiben an Gläubiger</h4>
                                                <p className="text-sm text-gray-600 mt-1">Vorlage für Gläubigeranschreiben</p>
                                                <button className="mt-2 text-sm text-purple-600 flex items-center">
                                                    <Download className="h-3 w-3 mr-1" /> Herunterladen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 border rounded-md hover:shadow-md transition-shadow">
                                        <div className="flex items-start">
                                            <FileText className="h-6 w-6 text-purple-500 mr-3 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-medium">Anschreiben an Behörden</h4>
                                                <p className="text-sm text-gray-600 mt-1">Vorlage für Behördenanschreiben</p>
                                                <button className="mt-2 text-sm text-purple-600 flex items-center">
                                                    <Download className="h-3 w-3 mr-1" /> Herunterladen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default DokumentePhase;