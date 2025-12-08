'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WorkOrder, WorkOrderStatus } from '@/types';
import { useWorkOrders } from '@/lib/hooks/useWorkOrders';
import { format } from 'date-fns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workOrderId = params.id as string;
  const supabase = createClient();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const { updateWorkOrder } = useWorkOrders();

  useEffect(() => {
    loadWorkOrder();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`work_order_${workOrderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders',
          filter: `id=eq.${workOrderId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setWorkOrder(payload.new as WorkOrder);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workOrderId]);

  const loadWorkOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', workOrderId)
        .single();

      if (error) throw error;
      setWorkOrder(data as WorkOrder);
    } catch (err) {
      console.error('Error loading work order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    if (!workOrder) return;
    try {
      await updateWorkOrder(workOrder.id, { status: newStatus });
      setWorkOrder({ ...workOrder, status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading work order...</p>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Work order not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Work Orders
        </button>

        <div className="rounded-lg bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{workOrder.title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Created {format(new Date(workOrder.created_at), 'PPpp')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${
                    workOrder.priority === 'P0'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : workOrder.priority === 'P1'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : workOrder.priority === 'P2'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}
                >
                  {workOrder.priority}
                </span>
                <select
                  value={workOrder.status}
                  onChange={(e) => handleStatusChange(e.target.value as WorkOrderStatus)}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Details</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{workOrder.type}</dd>
                </div>
                {workOrder.issue_type && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Issue Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{workOrder.issue_type}</dd>
                  </div>
                )}
                {workOrder.estimated_hours && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimated Hours</dt>
                    <dd className="mt-1 text-sm text-gray-900">{workOrder.estimated_hours}</dd>
                  </div>
                )}
                {workOrder.actual_hours && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Actual Hours</dt>
                    <dd className="mt-1 text-sm text-gray-900">{workOrder.actual_hours}</dd>
                  </div>
                )}
              </dl>
            </div>

            {workOrder.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{workOrder.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

