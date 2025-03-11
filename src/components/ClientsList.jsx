// src/components/ClientsList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://privatinsolvenz-backend.onrender.com';

const ClientsList = ({ phase = null, teamMode = null }) => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    
    // Parse search query from URL
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const searchQuery = searchParams.get('search');
        if (searchQuery) {
            setSearchTerm(searchQuery);
        }
    }, [location.search]);
    
    // State für Auto-Refresh
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // Auto-Refresh alle 15 Sekunden
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshTrigger(prev => prev + 1);
        }, 15000);
        
        return () => clearInterval(interval);
    }, []);
    
    // Manuelles Refresh-Handling
    const refreshData = () => {
        setRefreshTrigger(prev => prev + 1);
    };
    
    // Load clients from API
    useEffect(() => {
        const fetchClients = async () => {
            setIsLoading(true);
            try {
                console.log("Fetching clients from:", `${BACKEND_URL}/api/forms`);
                
                const response = await fetch(`${BACKEND_URL}/api/forms`);
                if (!response.ok) {
                    throw new Error('Failed to fetch clients');
                }
                
                const data = await response.json();
                
                // Debug-Ausgabe
                console.log("Raw data from backend:", data);
                
                // Transform data for frontend display
                const formattedData = data.map(client => ({
                    id: client.taskId || client._id,
                    name: client.leadName,
                    schulden: client.gesamtSchulden || "0",
                    phase: client.phase || "erstberatung",
                    phaseStatus: client.clickupData?.status || (client.qualifiziert ? "Qualifiziert" : "In Prüfung"),
                    qualifiziert: client.qualifiziert || false,
                    createdAt: new Date(client.createdAt),
                    updatedAt: new Date(client.updatedAt)
                }));
                
                // Sortiere nach neuesten Updates
                formattedData.sort((a, b) => b.updatedAt - a.updatedAt);
                
                setClients(formattedData);
                
                // Log the data
                console.log(`Loaded ${formattedData.length} clients from backend`);
            } catch (error) {
                console.error("Error loading clients:", error);
                
                // Fallback to mock data for testing
                console.log("Using mock client data due to error");
                const mockData = [
                    { 
                        id: "MOCK001", 
                        name: "Max Mustermann", 
                        schulden: "25000", 
                        phase: "erstberatung",
                        phaseStatus: "Neue Anfrage",
                        qualifiziert: true,
                        createdAt: new Date('2024-02-01'),
                        updatedAt: new Date('2024-02-01')
                    }
                ];
                
                setClients(mockData);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchClients();
    }, [refreshTrigger]);
    
    // Filter clients based on phase, search term, status, and team mode
    useEffect(() => {
        let filtered = [...clients];
        
        // Filter by phase if specified
        if (phase) {
            filtered = filtered.filter(client => client.phase === phase);
        }
        
        // Filter by team mode
        if (teamMode === 'verkauf') {
            // For Verkaufsteam, show only erstberatung and checkliste phases
            filtered = filtered.filter(client => 
                client.phase === 'erstberatung' || client.phase === 'checkliste'
            );
        } else if (teamMode === 'sachbearbeitung') {
            // For Sachbearbeitungsteam, show only dokumente phase
            filtered = filtered.filter(client => client.phase === 'dokumente');
        }
        
        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(client => 
                client.name.toLowerCase().includes(term) || 
                client.id.toLowerCase().includes(term)
            );
        }
        
        // Status filtering removed - no longer needed
        
        // Sort by most recently updated
        filtered.sort((a, b) => b.updatedAt - a.updatedAt);
        
        setFilteredClients(filtered);
    }, [clients, phase, searchTerm, teamMode]);
    
    // Format date for display
    const formatDate = (date) => {
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };
    
    // Get phase metadata (color, label, path)
    const getPhaseDetails = (client) => {
        const phaseType = client.phase;
        
        // Determine the base path based on the team mode
        const basePath = teamMode === 'verkauf' 
            ? '/verkauf' 
            : teamMode === 'sachbearbeitung' 
                ? '/sachbearbeitung' 
                : '/dashboard';
        
        let details;
        
        switch(phaseType) {
            case 'erstberatung':
                details = {
                    color: '#9c1b1c',
                    bgColor: '#f5e6e6',
                    label: 'Erstberatung',
                    path: `${basePath}/erstberatung`
                };
                break;
            case 'checkliste':
                details = {
                    color: '#9c1b1c',
                    bgColor: '#f5e6e6',
                    label: 'Checkliste',
                    path: `${basePath}/checkliste`
                };
                break;
            case 'dokumente':
                details = {
                    color: '#9c1b1c',
                    bgColor: '#f5e6e6',
                    label: 'Dokumente',
                    path: `${basePath}/dokumente`
                };
                break;
            default:
                details = {
                    color: 'gray',
                    bgColor: '#f1f1f1',
                    label: 'Unbekannt',
                    path: basePath
                };
        }
        
        // Add the sublabel from the client's phaseStatus if available
        if (client.phaseStatus) {
            details.sublabel = client.phaseStatus;
        }
        
        return details;
    };
    
    // No longer needed as we're directly showing the phase status
    // Keeping for reference
    /*
    const getStatusBadge = (qualified) => {
        return qualified ? 
            <span className="px-2 py-1 bg-[#f5e6e6] text-[#9c1b1c] rounded-full text-xs font-medium">Qualifiziert</span> : 
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">In Prüfung</span>;
    };
    */
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c1b1c]"></div>
                <span className="ml-2">Daten werden geladen...</span>
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto">
            {/* Header section */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1">
                    {phase ? getPhaseDetails({phase}).label : 'Alle Mandanten'}
                </h1>
                <p className="text-gray-600">
                    {filteredClients.length} {filteredClients.length === 1 ? 'Mandant' : 'Mandanten'} gefunden
                </p>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <div className="flex gap-2 flex-wrap">
                    <button 
                        className={`px-4 py-2 rounded-lg transition-colors ${!phase || phase === 'all'
                            ? 'bg-[#9c1b1c] text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => navigate(teamMode === 'verkauf' ? '/verkauf' : '/sachbearbeitung')}
                    >
                        Alle
                    </button>
                    
                    <button 
                        className="px-4 py-2 rounded-lg transition-colors bg-[#f5e6e6] text-[#9c1b1c] hover:bg-[#f0d7d7]"
                        onClick={refreshData}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <polyline points="23 20 23 14 17 14"></polyline>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                        </svg>
                        Aktualisieren
                    </button>
                    
                    {/* Only show Erstberatung and Checkliste for Verkaufsteam */}
                    {teamMode === 'verkauf' && (
                        <>
                            <button 
                                className={`px-4 py-2 rounded-lg transition-colors ${phase === 'erstberatung' 
                                    ? 'bg-[#9c1b1c] text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                onClick={() => navigate('/verkauf/erstberatung')}
                            >
                                Erstberatung
                            </button>
                            <button 
                                className={`px-4 py-2 rounded-lg transition-colors ${phase === 'checkliste' 
                                    ? 'bg-[#9c1b1c] text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                onClick={() => navigate('/verkauf/checkliste')}
                            >
                                Checkliste
                            </button>
                        </>
                    )}
                    
                    {/* Show only Dokumente for Sachbearbeitungsteam */}
                    {teamMode === 'sachbearbeitung' && (
                        <button 
                            className={`px-4 py-2 rounded-lg transition-colors ${phase === 'dokumente' 
                                ? 'bg-[#9c1b1c] text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            onClick={() => navigate('/sachbearbeitung/dokumente')}
                        >
                            Dokumente
                        </button>
                    )}
                </div>
                
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Mandant suchen..."
                        className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c1b1c] focus:border-[#9c1b1c]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
            </div>
            
            {/* Clients List */}
            {filteredClients.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                    <div className="w-16 h-16 mx-auto bg-[#f5e6e6] rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#9c1b1c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Keine Mandanten gefunden</h3>
                    <p className="text-gray-500">Versuchen Sie es mit einer anderen Filtereinstellung oder fügen Sie neue Mandanten hinzu.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredClients.map(client => {
                        const phaseDetails = getPhaseDetails(client);

                        return (
                            <div 
                                key={client.id} 
                                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                            >
                                <div className="p-5">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#f5e6e6] flex items-center justify-center text-[#9c1b1c] font-medium mr-4">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">{client.name}</h3>
                                                <div className="mt-1 text-sm">
                                                    <span className="text-gray-600">Aktenzeichen:</span> {client.id}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 rounded-full text-sm font-medium" 
                                                     style={{backgroundColor: phaseDetails.bgColor, color: phaseDetails.color}}>
                                                    {phaseDetails.label}
                                                </div>
                                                <div className="px-3 py-1 rounded-full text-sm font-medium" 
                                                     style={{backgroundColor: '#f5e6e6', color: '#9c1b1c'}}>
                                                    {phaseDetails.sublabel || (client.qualifiziert ? 'Qualifiziert' : 'In Prüfung')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-sm text-gray-500 mb-1">Schulden</div>
                                            <div className="font-semibold">{Number(client.schulden).toLocaleString('de-DE')} €</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-sm text-gray-500 mb-1">Erstellt am</div>
                                            <div className="font-semibold">{formatDate(client.createdAt)}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-sm text-gray-500 mb-1">Letzte Aktualisierung</div>
                                            <div className="font-semibold">{formatDate(client.updatedAt)}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end">
                                        <Link 
                                            to={`${phaseDetails.path}/${client.id}`}
                                            className="px-4 py-2 bg-[#9c1b1c] text-white rounded hover:bg-[#7e1617] transition-colors"
                                        >
                                            Details öffnen
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ClientsList;