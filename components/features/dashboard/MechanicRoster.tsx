'use client';

import { Mechanic, WorkOrder } from '@/types';
import { UserIcon } from '@heroicons/react/24/outline';

interface MechanicRosterProps {
  mechanics: Mechanic[];
  workOrders: WorkOrder[];
}

export function MechanicRoster({ mechanics, workOrders }: MechanicRosterProps) {
  const getMechanicWorkOrders = (mechanicId: string) => {
    return workOrders.filter((wo) => wo.assigned_mechanic_id === mechanicId);
  };

  const getOpenWorkOrders = (mechanicId: string) => {
    return getMechanicWorkOrders(mechanicId).filter(
      (wo) => wo.status !== 'Closed' && wo.status !== 'Cancelled'
    );
  };

  return (
    <div className="rounded-lg bg-white shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Mechanic Roster</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mechanics.map((mechanic) => {
          const openWOs = getOpenWorkOrders(mechanic.id);
          const criticalWOs = openWOs.filter((wo) => wo.priority === 'P0').length;

          return (
            <div
              key={mechanic.id}
              className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                  <UserIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mechanic #{mechanic.id.slice(0, 8)}</h3>
                  {mechanic.specialty && (
                    <p className="text-sm text-gray-500">{mechanic.specialty}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Open Work Orders:</span>
                  <span className="font-medium">{openWOs.length}</span>
                </div>
                {criticalWOs > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-600">Critical (P0):</span>
                    <span className="font-medium text-red-600">{criticalWOs}</span>
                  </div>
                )}
                {mechanic.shift_pattern && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shift:</span>
                    <span className="font-medium">{mechanic.shift_pattern}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {mechanics.length === 0 && (
        <p className="text-center text-gray-500 py-8">No mechanics found</p>
      )}
    </div>
  );
}

