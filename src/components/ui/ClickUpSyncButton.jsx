// src/components/ui/ClickUpSyncButton.jsx
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { syncFormWithClickUp } from '../../services/clickupService';

/**
 * A reusable button component for syncing forms with ClickUp
 * 
 * @param {object} props
 * @param {string} props.taskId - The ClickUp task ID to synchronize
 * @param {function} props.onSuccess - Callback function to execute on successful sync
 * @param {function} props.onError - Callback function to execute on sync error
 * @param {string} props.className - Additional CSS classes to apply to the button
 */
const ClickUpSyncButton = ({ 
  taskId, 
  onSuccess = () => {}, 
  onError = () => {},
  className = '',
  children
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!taskId || isSyncing) return;

    try {
      setIsSyncing(true);
      const result = await syncFormWithClickUp(taskId);
      
      if (result.success) {
        onSuccess(result);
      } else {
        onError(new Error(result.message || 'Synchronisierung fehlgeschlagen'));
      }
    } catch (error) {
      console.error('Error syncing with ClickUp:', error);
      onError(error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
        isSyncing ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 
        'bg-[#f5e6e6] text-[#9c1b1c] hover:bg-[#f0d7d7]'
      } transition-colors ${className}`}
      title="Mit ClickUp synchronisieren"
    >
      <RefreshCw className={`h-4 w-4 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
      {children || (isSyncing ? 'Synchronisiere...' : 'Mit ClickUp synch.')}
    </button>
  );
};

export default ClickUpSyncButton;