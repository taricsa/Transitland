'use client';

import { useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineQueue } from '@/lib/utils/offlineQueue';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export function SyncStatus() {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updatePendingCount = () => {
      setPendingCount(offlineQueue.getPendingCount());
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 1000);

    // Listen for sync events
    const handleSync = () => {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        updatePendingCount();
      }, 2000);
    };

    window.addEventListener('sync', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sync', handleSync);
    };
  }, []);

  if (!isOnline && pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-600">
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
        <span>{pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}</span>
      </div>
    );
  }

  if (isOnline && pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600">
        {isSyncing ? (
          <>
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            <span>Syncing...</span>
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-4 w-4" />
            <span>Synced</span>
          </>
        )}
      </div>
    );
  }

  if (isOnline && pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircleIcon className="h-4 w-4" />
        <span>All synced</span>
      </div>
    );
  }

  return null;
}

