'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md bg-yellow-500 px-4 py-2 text-white shadow-lg">
      <ExclamationTriangleIcon className="h-5 w-5" />
      <span className="text-sm font-medium">Offline Mode - Changes will sync when connection is restored</span>
    </div>
  );
}

