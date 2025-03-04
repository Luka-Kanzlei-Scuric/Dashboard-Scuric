import { useState, useEffect } from 'react';
import { getClickUpLeads, importClickUpTask } from '../services/clickupService';
import { Card } from './ui/card';
import { Alert } from './ui/alert';

const ClickUpImport = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [importingTask, setImportingTask] = useState(null);

  // Fetch leads from ClickUp
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getClickUpLeads();
        setLeads(data || []);
      } catch (err) {
        setError('ClickUp-Daten konnten nicht geladen werden. Bitte überprüfen Sie die API-Konfiguration.');
        console.error('Error loading ClickUp leads:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Import a task from ClickUp to our system
  const handleImportTask = async (taskId) => {
    try {
      setImportingTask(taskId);
      setError(null);
      setSuccess(null);
      await importClickUpTask(taskId);
      setSuccess(`Aufgabe ${taskId} erfolgreich importiert!`);
      
      // Remove imported task from list
      setLeads(leads.filter(task => task.id !== taskId));
    } catch (err) {
      setError(err.response?.data?.message || 'Fehler beim Importieren der Aufgabe');
      console.error('Error importing task:', err);
    } finally {
      setImportingTask(null);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">ClickUp-Anfragen importieren</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
          {success}
        </Alert>
      )}
      
      {loading ? (
        <div className="py-10 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#9c1b1c]"></div>
          <p className="mt-2 text-gray-600">Daten werden geladen...</p>
        </div>
      ) : leads.length === 0 ? (
        <p className="py-10 text-center text-gray-600">
          Keine neuen Anfragen in ClickUp gefunden oder Zugriff nicht möglich.
        </p>
      ) : (
        <div>
          <p className="mb-4 text-gray-600">Die folgenden Anfragen wurden in ClickUp gefunden und können in das Dashboard importiert werden:</p>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {leads.map(task => (
              <div 
                key={task.id} 
                className="p-4 border rounded-lg flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <h3 className="font-medium">{task.name}</h3>
                  <p className="text-sm text-gray-600">Status: {task.status.status} | Erstellt: {new Date(task.date_created).toLocaleDateString()}</p>
                </div>
                
                <button
                  onClick={() => handleImportTask(task.id)}
                  disabled={importingTask === task.id}
                  className={`
                    px-4 py-2 rounded-md text-white
                    ${importingTask === task.id ? 'bg-gray-400' : 'bg-[#9c1b1c] hover:bg-[#851718]'}
                    transition-colors
                  `}
                >
                  {importingTask === task.id ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importieren...
                    </span>
                  ) : (
                    'Importieren'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ClickUpImport;