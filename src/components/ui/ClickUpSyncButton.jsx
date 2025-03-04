import { useState } from 'react';
import { syncFormWithClickUp } from '../../services/clickupService';

const ClickUpSyncButton = ({ taskId, onSuccess, onError }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      const result = await syncFormWithClickUp(taskId);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error syncing with ClickUp:', error);
      
      if (onError) {
        onError(error.response?.data?.message || 'Fehler bei der Synchronisierung mit ClickUp');
      }
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className={`
        flex items-center px-3 py-1.5 text-sm font-medium rounded-md
        ${isSyncing ? 'bg-gray-300 text-gray-600' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}
        transition-colors duration-200
      `}
      title="Mit ClickUp synchronisieren"
    >
      {isSyncing ? (
        <>
          <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Synchronisiere...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Mit ClickUp synch.
        </>
      )}
    </button>
  );
};

export default ClickUpSyncButton;