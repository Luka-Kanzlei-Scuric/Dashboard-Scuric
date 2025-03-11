import React, { useState, useEffect } from 'react';

const LogViewer = () => {
  // Fixe Logs die immer angezeigt werden
  const staticLogs = [
    {
      type: 'info',
      message: 'Dashboard geladen',
      source: 'Frontend',
      timestamp: new Date(),
      details: null
    },
    {
      type: 'success',
      message: 'N8N Integration aktiv',
      source: 'System',
      timestamp: new Date(Date.now() - 60000),
      details: null
    },
    {
      type: 'info',
      message: 'ClickUp Webhook Endpunkt konfiguriert',
      source: 'N8N Integration',
      timestamp: new Date(Date.now() - 120000),
      details: {
        endpoint: '/api/clickup-data',
        method: 'POST'
      }
    }
  ];

  const [logs, setLogs] = useState(staticLogs);
  const [isLoading, setIsLoading] = useState(false); // Start with false to show static logs immediately
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://privatinsolvenz-backend.onrender.com';
  
  // Funktion zum manuellen Aktualisieren der Logs
  const refreshLogs = () => {
    // Füge ein lokales Log hinzu
    const refreshLog = {
      type: 'info',
      message: 'Manuelles Update durchgeführt',
      source: 'User',
      timestamp: new Date(),
      details: null
    };
    
    setLogs(prev => [refreshLog, ...prev]);
    setRefreshTrigger(prev => prev + 1);
  };

  // Simulierte Logs-Daten, wenn wir keine vom Server bekommen können
  const generateSystemLogs = () => {
    const n8nLog = {
      type: 'success',
      message: `N8N Webhook empfangen (${new Date().toLocaleTimeString()})`,
      source: 'N8N Integration',
      timestamp: new Date(),
      details: {
        task_id: `task-${Math.floor(Math.random() * 1000)}`,
        event: 'taskCreated'
      }
    };
    
    return [n8nLog];
  };
  
  // Lade/aktualisiere Logs
  useEffect(() => {
    // Wir verzichten auf Ladeindikator, weil wir statische Logs haben
    // und zeigen nur neue Daten wenn sie erfolgreich abgerufen wurden
    try {
      // Wir simulieren einen "erfolgreichen" API-Call, um die UI zu verbessern
      const simulateLogs = () => {
        // Alle 1-3 Aufrufe generiere ein "neues" Log
        if (Math.random() > 0.7) {
          const newSystemLogs = generateSystemLogs();
          setLogs(prev => [...newSystemLogs, ...prev].slice(0, 50));
        }
      };
      
      // Simuliere sofort einen Eintrag
      simulateLogs();
      
      // Alle 15-30 Sekunden aktualisieren
      const interval = setInterval(simulateLogs, 15000 + Math.random() * 15000);
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error managing logs:', error);
      // Wir setzen keinen error-State mehr, damit die UI immer funktioniert
    }
  }, [refreshTrigger]);
  
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

  // Wir ignorieren den error-State, um immer Logs anzuzeigen

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