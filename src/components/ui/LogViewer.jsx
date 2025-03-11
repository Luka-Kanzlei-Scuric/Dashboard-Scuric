import React, { useState, useEffect } from 'react';

const LogViewer = () => {
  const [logs, setLogs] = useState([
    // Beispiel-Log damit etwas angezeigt wird
    {
      type: 'info',
      message: 'Dashboard geladen',
      source: 'Frontend',
      timestamp: new Date(),
      details: null
    }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://privatinsolvenz-backend.onrender.com';
  
  // Direkte Anfrage testen
  useEffect(() => {
    // Test-Log im Browser hinzufügen
    console.log(`Backend URL: ${BACKEND_URL}`);
    
    // Teste Direktverbindung
    fetch(`${BACKEND_URL}/api/test-client`)
      .then(res => res.json())
      .then(data => console.log('Backend Test erfolgreich:', data))
      .catch(err => console.error('Backend Test fehlgeschlagen:', err));
  }, []);
  
  // Funktion zum manuellen Aktualisieren der Logs
  const refreshLogs = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        // Temporär auf test-logs umleiten
        console.log('Fetching logs from:', `${BACKEND_URL}/api/test-logs`);
        
        // Explizite CORS-Konfiguration
        const response = await fetch(`${BACKEND_URL}/api/test-logs`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Logs received:', data);
        
        if (!data || !data.logs) {
          console.warn('Unexpected data format, logs property missing:', data);
          // Bei Fehler behalten wir die vorhandenen Logs bei
        } else {
          // Vorhandene Logs mit neuen kombinieren
          const newLogs = [...data.logs, ...logs];
          // Auf maximal 50 begrenzen
          setLogs(newLogs.slice(0, 50));
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
        setError('Failed to load logs. ' + (error.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
    
    // Refresh logs every 15 seconds
    const interval = setInterval(fetchLogs, 15000);
    
    return () => clearInterval(interval);
  }, [BACKEND_URL, refreshTrigger]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Get appropriate badge color based on log type
  const getBadgeClass = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c1b1c]"></div>
        <span className="ml-2">Logs werden geladen...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-lg">
        <h3 className="font-bold">Fehler</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">System Logs</h2>
        <button 
          onClick={refreshLogs}
          className="px-4 py-2 bg-[#f5e6e6] text-[#9c1b1c] rounded-md hover:bg-[#f0d7d7] transition-colors"
        >
          Aktualisieren
        </button>
      </div>
      
      {logs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Keine Logs vorhanden</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="border-l-4 border-gray-300 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-md ${getBadgeClass(log.type)}`}>
                    {log.type.toUpperCase()}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">{formatDate(log.timestamp)}</span>
                </div>
                {log.source && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {log.source}
                  </span>
                )}
              </div>
              <p className="mt-2 text-gray-800">{log.message}</p>
              {log.details && (
                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                  {typeof log.details === 'object' 
                    ? JSON.stringify(log.details, null, 2) 
                    : log.details}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogViewer;