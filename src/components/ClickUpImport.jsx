// src/components/ClickUpImport.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClickUpLeads, importClickUpTask } from '../services/clickupService';
import { Card } from './ui/card';
import { Alert } from './ui/alert';

const ClickUpImport = () => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [importStatus, setImportStatus] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load leads from ClickUp
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getClickUpLeads();
        if (response.success) {
          setLeads(response.leads || []);
        } else {
          throw new Error(response.message || 'Fehler beim Laden der Leads');
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
        setError('Fehler beim Laden der Leads aus ClickUp. Bitte versuchen Sie es später erneut.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Filter leads based on search term
  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle importing a task
  const handleImport = async (taskId) => {
    try {
      setImportStatus(prev => ({ ...prev, [taskId]: 'loading' }));
      
      const response = await importClickUpTask(taskId);
      
      if (response.success) {
        setImportStatus(prev => ({ ...prev, [taskId]: 'success' }));
        
        // Auto-navigate to the imported task after a short delay
        setTimeout(() => {
          const formId = response.form.taskId;
          const phase = response.form.phase || 'erstberatung';
          navigate(`/verkauf/${phase}/${formId}`);
        }, 1500);
      } else {
        setImportStatus(prev => ({ ...prev, [taskId]: 'error' }));
      }
    } catch (error) {
      console.error('Error importing task:', error);
      setImportStatus(prev => ({ ...prev, [taskId]: 'error' }));
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c1b1c]"></div>
        <span className="ml-2">Leads werden geladen...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">ClickUp Import</h1>
        <p className="text-gray-600">
          Importieren Sie Leads direkt aus ClickUp in das Dashboard
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Search box */}
      <div className="mb-6">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Lead suchen..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c1b1c] focus:border-[#9c1b1c]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Leads list */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
          <div className="w-16 h-16 mx-auto bg-[#f5e6e6] rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#9c1b1c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Keine Leads gefunden</h3>
          <p className="text-gray-500">Versuchen Sie es mit einer anderen Suche oder prüfen Sie die Verbindung zu ClickUp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredLeads.map(lead => (
            <Card key={lead.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#f5e6e6] flex items-center justify-center text-[#9c1b1c] font-medium mr-4">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{lead.name}</h3>
                      <div className="mt-1 text-sm">
                        <span className="text-gray-600">ClickUp ID:</span> {lead.id}
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-[#f5e6e6] text-[#9c1b1c]">
                    {lead.status}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className="font-semibold">{lead.status}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-500 mb-1">Erstellt am</div>
                    <div className="font-semibold">{formatDate(lead.dateCreated)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-500 mb-1">Zuletzt aktualisiert</div>
                    <div className="font-semibold">{formatDate(lead.dateUpdated)}</div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => handleImport(lead.id)}
                    disabled={importStatus[lead.id] === 'loading' || importStatus[lead.id] === 'success'}
                    className={`px-4 py-2 rounded-md flex items-center transition-colors ${
                      importStatus[lead.id] === 'loading' ? 'bg-gray-300 text-gray-600 cursor-not-allowed' :
                      importStatus[lead.id] === 'success' ? 'bg-green-500 text-white cursor-not-allowed' :
                      importStatus[lead.id] === 'error' ? 'bg-red-500 text-white hover:bg-red-600' :
                      'bg-[#9c1b1c] text-white hover:bg-[#7e1617]'
                    }`}
                  >
                    {importStatus[lead.id] === 'loading' && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {importStatus[lead.id] === 'success' && (
                      <svg className="-ml-1 mr-2 h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                    {importStatus[lead.id] === 'error' && (
                      <svg className="-ml-1 mr-2 h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    )}
                    {importStatus[lead.id] === 'loading' ? 'Wird importiert...' :
                     importStatus[lead.id] === 'success' ? 'Erfolgreich importiert' :
                     importStatus[lead.id] === 'error' ? 'Fehler - Erneut versuchen' :
                     'Importieren'}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClickUpImport;