// src/components/layout/Dashboard.jsx
import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Search, Menu, X, ArrowLeft, RefreshCw } from 'lucide-react';
import { syncAllWithClickUp } from '../../services/clickupService';

const Dashboard = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const phase = params.phase;
    const taskId = params.taskId;
    
    // Toggle sidebar on mobile
    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    // Handle search submission
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Pass the search term to the ClientsList component via URL query parameter
            const currentPath = location.pathname.split('/')[1]; // Get current section (verkauf)
            const searchPath = currentPath === 'verkauf' ? '/verkauf' : `/${currentPath}`;
            
            // Create a URLSearchParams object
            const searchParams = new URLSearchParams();
            searchParams.append('search', searchQuery.trim());
            
            // Navigate to the same page but with search parameter
            navigate(`${searchPath}?${searchParams.toString()}`);
            
            console.log(`Searching for: ${searchQuery}`);
        }
    };

    // Navigate to a specific phase
    const navigateToPhase = (newPhase, clientId = taskId) => {
        if (clientId) {
            navigate(`/verkauf/${newPhase}/${clientId}`);
        } else {
            navigate(`/verkauf/${newPhase}`);
        }
    };

    // Go back to team selection
    const goToTeamSelection = () => {
        navigate('/');
    };
    
    // Sync all forms with ClickUp
    const handleSyncAll = async () => {
        if (isSyncing) return;
        
        try {
            setIsSyncing(true);
            setSyncMessage({ type: 'info', text: 'Synchronisierung läuft...' });
            
            const result = await syncAllWithClickUp();
            
            setSyncMessage({ 
                type: 'success', 
                text: `Synchronisierung erfolgreich! ${result.results.successful} erfolgreich, ${result.results.failed} fehlgeschlagen.` 
            });
            
            // Auto-hide success message after 5 seconds
            setTimeout(() => {
                if (setSyncMessage._currentValue?.type === 'success') {
                    setSyncMessage(null);
                }
            }, 5000);
        } catch (error) {
            console.error('Fehler bei der Synchronisierung:', error);
            setSyncMessage({ 
                type: 'error', 
                text: 'Synchronisierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' 
            });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile sidebar toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-20">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-md bg-white shadow-md"
                >
                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Sidebar */}
            <div
                className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } fixed lg:relative lg:translate-x-0 z-10 w-64 h-full bg-white shadow-lg transition-transform duration-300 ease-in-out`}
            >
                <div className="p-4 border-b">
                    <div className="flex justify-center">
                        <img src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" 
                             alt="Scuric Rechtsanwälte" 
                             className="h-auto w-44 object-contain" />
                    </div>
                </div>

                <div className="p-4 border-b bg-[#f5e6e6] text-[#9c1b1c]">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-medium">Verkaufsteam</span>
                    </div>
                    <button 
                        onClick={goToTeamSelection}
                        className="mt-2 text-sm flex items-center hover:underline"
                    >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Zurück zur Auswahl
                    </button>
                </div>

                <nav className="mt-4">
                    <div className="px-4 py-2 text-xs text-gray-600 uppercase">Navigation</div>
                    <ul>
                        <li>
                            <button
                                className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-100 ${location.pathname === '/verkauf' ? 'bg-gray-200 border-l-4 border-[#9c1b1c]' : ''}`}
                                onClick={() => navigate('/verkauf')}
                            >
                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5e6e6] text-[#9c1b1c] mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                        <polyline points="9 22 9 12 15 12 15 22"/>
                                    </svg>
                                </span>
                                <span>Mandanten</span>
                            </button>
                        </li>
                        <li>
                            <button
                                className="w-full text-left px-4 py-3 flex items-center hover:bg-gray-100"
                                onClick={() => navigate('/verkauf/clickup-import')}
                            >
                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5e6e6] text-[#9c1b1c] mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                </span>
                                <span>ClickUp Import</span>
                            </button>
                        </li>
                        <li>
                            <button
                                className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-100 ${location.pathname.includes('/verkauf/logs') ? 'bg-gray-200 border-l-4 border-[#9c1b1c]' : ''}`}
                                onClick={() => navigate('/verkauf/logs')}
                            >
                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5e6e6] text-[#9c1b1c] mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="17" y1="10" x2="3" y2="10"></line>
                                        <line x1="21" y1="6" x2="3" y2="6"></line>
                                        <line x1="21" y1="14" x2="3" y2="14"></line>
                                        <line x1="17" y1="18" x2="3" y2="18"></line>
                                    </svg>
                                </span>
                                <span>System Logs</span>
                            </button>
                        </li>
                    </ul>
                    
                    <div className="px-4 py-2 mt-4 text-xs text-gray-600 uppercase">Phasen</div>
                    <ul>
                        <li>
                            <button
                                className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-100 ${location.pathname.includes('/verkauf/erstberatung') ? 'bg-gray-200 border-l-4 border-[#9c1b1c]' : ''}`}
                                onClick={() => navigateToPhase('erstberatung')}
                            >
                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5e6e6] text-[#9c1b1c] mr-3">1</span>
                                <span>Erstberatung</span>
                            </button>
                        </li>
                        <li>
                            <button
                                className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-100 ${location.pathname.includes('/verkauf/checkliste') ? 'bg-gray-200 border-l-4 border-[#9c1b1c]' : ''}`}
                                onClick={() => navigateToPhase('checkliste')}
                            >
                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5e6e6] text-[#9c1b1c] mr-3">2</span>
                                <span>Checkliste</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top navigation */}
                <header className="bg-white shadow-sm">
                    <div className="px-4 py-4 flex justify-between items-center border-b shadow-sm">
                        <h2 className="text-xl font-semibold flex items-center">
                            {location.pathname.includes('/verkauf/erstberatung') && (
                                <>
                                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5e6e6] text-[#9c1b1c] mr-3">1</span>
                                    <span>Erstberatung</span>
                                </>
                            )}
                            {location.pathname.includes('/verkauf/checkliste') && (
                                <>
                                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5e6e6] text-[#9c1b1c] mr-3">2</span>
                                    <span>Checkliste</span>
                                </>
                            )}
                            {location.pathname === '/verkauf' && (
                                <>
                                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5e6e6] text-[#9c1b1c] mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </span>
                                    <span>Mandanten</span>
                                </>
                            )}
                        </h2>

                        <div className="flex items-center">
                            <form onSubmit={handleSearch} className="mr-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Mandant suchen..."
                                        className="py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c1b1c] focus:border-[#9c1b1c] w-64 transition-all duration-200"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                </div>
                            </form>
                            
                            <button
                                onClick={handleSyncAll}
                                disabled={isSyncing}
                                className={`flex items-center mr-4 px-3 py-2 text-sm font-medium rounded-md ${
                                    isSyncing ? 'bg-gray-300 text-gray-600' : 'bg-[#f5e6e6] text-[#9c1b1c] hover:bg-[#f0d7d7]'
                                } transition-colors`}
                                title="Alle Einträge mit ClickUp synchronisieren"
                            >
                                <RefreshCw className={`h-4 w-4 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Synchronisiere...' : 'Mit ClickUp synch.'}
                            </button>
                            
                            <div className="w-10 h-10 bg-[#f5e6e6] text-[#9c1b1c] rounded-full flex items-center justify-center">
                                <span className="font-medium">RA</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {/* Sync message display */}
                    {syncMessage && (
                        <div className={`mb-4 p-3 rounded-md ${
                            syncMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                            syncMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                            'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                            <div className="flex">
                                {syncMessage.type === 'success' && (
                                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {syncMessage.type === 'error' && (
                                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                {syncMessage.type === 'info' && (
                                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                <span>{syncMessage.text}</span>
                                <button 
                                    onClick={() => setSyncMessage(null)}
                                    className="ml-auto text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;