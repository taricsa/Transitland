'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WorkOrder, Mechanic } from '@/types';
import { useWorkOrders } from '@/lib/hooks/useWorkOrders';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface WorkOrderAssignmentModalProps {
  workOrder: WorkOrder;
  mechanics: Mechanic[];
  garageId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function WorkOrderAssignmentModal({
  workOrder,
  mechanics,
  garageId,
  onClose,
  onSuccess,
}: WorkOrderAssignmentModalProps) {
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateWorkOrder } = useWorkOrders();
  const supabase = createClient();
  const [mechanicNames, setMechanicNames] = useState<Record<string, string>>({});

  // Load mechanic names
  useEffect(() => {
    async function loadMechanicNames() {
      if (mechanics.length === 0) return;
      
      const userIds = mechanics.map((m) => m.user_id).filter(Boolean);
      if (userIds.length === 0) return;

      const { data: usersData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds);

      if (usersData) {
        const typedUsersData = usersData as Array<{ id: string; name?: string | null }>;
        const names: Record<string, string> = {};
        mechanics.forEach((mechanic) => {
          const user = typedUsersData.find((u) => u.id === mechanic.user_id);
          if (user && user.name) {
            names[mechanic.id] = user.name;
          }
        });
        setMechanicNames(names);
      }
    }
    loadMechanicNames();
  }, [mechanics, supabase]);

  const handleAssign = async () => {
    if (!selectedMechanicId) {
      setError('Please select a mechanic');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await updateWorkOrder(workOrder.id, {
        assigned_mechanic_id: selectedMechanicId,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign work order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Assign Work Order</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Work Order Details */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">{workOrder.title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                workOrder.priority === 'P0'
                  ? 'bg-red-100 text-red-700'
                  : workOrder.priority === 'P1'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {workOrder.priority}
              </span>
              <span className="text-sm text-slate-600">{workOrder.status}</span>
            </div>
            {workOrder.description && (
              <p className="text-sm text-slate-600">{workOrder.description}</p>
            )}
          </div>

          {/* Mechanic Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Mechanic
            </label>
            <select
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a mechanic...</option>
              {mechanics.map((mechanic) => (
                <option key={mechanic.id} value={mechanic.id}>
                  {mechanicNames[mechanic.id] || `Mechanic ${mechanic.id.slice(0, 8)}`}
                  {mechanic.specialty && ` - ${mechanic.specialty}`}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedMechanicId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

