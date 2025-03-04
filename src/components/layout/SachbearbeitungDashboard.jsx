// src/components/layout/SachbearbeitungDashboard.jsx
import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Search, Menu, X, ArrowLeft, FileText } from 'lucide-react';

const SachbearbeitungDashboard = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
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
            // Navigate to search results or client page
            console.log(`Searching for: ${searchQuery}`);
            // Example implementation could be added here
        }
    };

    // Navigate to a specific phase
    const navigateToPhase = (newPhase, clientId = taskId) => {
        if (clientId) {
            navigate(`/sachbearbeitung/${newPhase}/${clientId}`);
        } else {
            navigate(`/sachbearbeitung/${newPhase}`);
        }
    };

    // Go back to team selection
    const goToTeamSelection = () => {
        navigate('/');
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
                        <FileText className="h-5 w-5 mr-2" />
                        <span className="font-medium">Sachbearbeitungsteam</span>
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
                                className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-100 ${location.pathname === '/sachbearbeitung' ? 'bg-gray-200 border-l-4 border-[#9c1b1c]' : ''}`}
                                onClick={() => navigate('/sachbearbeitung')}
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
                    </ul>
                    
                    <div className="px-4 py-2 mt-4 text-xs text-gray-600 uppercase">Bearbeitung</div>
                    <ul>
                        <li>
                            <button
                                className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-100 ${location.pathname.includes('/sachbearbeitung/dokumente') ? 'bg-gray-200 border-l-4 border-[#9c1b1c]' : ''}`}
                                onClick={() => navigateToPhase('dokumente')}
                            >
                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5e6e6] text-[#9c1b1c] mr-3">
                                    <FileText className="h-5 w-5" />
                                </span>
                                <span>Dokumente & Daten</span>
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
                            {location.pathname.includes('/sachbearbeitung/dokumente') && (
                                <>
                                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5e6e6] text-[#9c1b1c] mr-3">
                                        <FileText className="h-5 w-5" />
                                    </span>
                                    <span>Dokumente & Daten</span>
                                </>
                            )}
                            {location.pathname === '/sachbearbeitung' && (
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
                            <div className="w-10 h-10 bg-[#f5e6e6] text-[#9c1b1c] rounded-full flex items-center justify-center">
                                <span className="font-medium">SB</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default SachbearbeitungDashboard;