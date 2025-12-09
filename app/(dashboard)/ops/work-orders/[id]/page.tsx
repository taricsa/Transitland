'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority, Mechanic, WorkOrderPart, InventoryItem, InventoryStock } from '@/types';
import { useWorkOrders } from '@/lib/hooks/useWorkOrders';
import { WorkOrderAssignmentModal } from '@/components/features/work-orders/WorkOrderAssignmentModal';
import { format } from 'date-fns';
import { 
  ArrowLeftIcon,
  PencilIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  XMarkIcon,
  CheckCircleIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { handleLogout } from '@/lib/utils/logout';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workOrderId = params.id as string;
  const supabase = createClient();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [parts, setParts] = useState<Array<WorkOrderPart & { item?: InventoryItem; stock?: InventoryStock }>>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateWorkOrder } = useWorkOrders();
  const [garageId, setGarageId] = useState<string | null>(null);

  const loadWorkOrder = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', workOrderId)
        .single();

      if (error) throw error;
      const typedWorkOrder = data as WorkOrder;
      setWorkOrder(typedWorkOrder);

      // Load vehicle
      if (typedWorkOrder.vehicle_id) {
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', typedWorkOrder.vehicle_id)
          .single();
        if (vehicleData) {
          setVehicle(vehicleData);
          const typedVehicle = vehicleData as { garage_id: string };
          setGarageId(typedVehicle.garage_id);
        }
      }
    } catch (err) {
      console.error('Error loading work order:', err);
      setError('Failed to load work order');
    } finally {
      setLoading(false);
    }
  }, [workOrderId, supabase]);

  const loadParts = useCallback(async () => {
    if (!workOrderId || !garageId) return;

    try {
      // Load work order parts
      const { data: partsData } = await supabase
        .from('work_order_parts')
        .select('*')
        .eq('work_order_id', workOrderId);

      if (partsData) {
        // Load inventory items and stock for each part
        const partsWithDetails = await Promise.all(
          partsData.map(async (part: any) => {
            const { data: itemData } = await supabase
              .from('inventory_items')
              .select('*')
              .eq('id', part.inventory_item_id)
              .single();

            const { data: stockData } = await supabase
              .from('inventory_stock')
              .select('*')
              .eq('inventory_item_id', part.inventory_item_id)
              .eq('garage_id', garageId)
              .single();

            return {
              ...part,
              item: (itemData || undefined) as InventoryItem | undefined,
              stock: (stockData || undefined) as InventoryStock | undefined,
            };
          })
        );
        setParts(partsWithDetails);
      }
    } catch (err) {
      console.error('Error loading parts:', err);
    }
  }, [workOrderId, garageId, supabase]);

  const loadMechanics = useCallback(async () => {
    if (!garageId) return;

    try {
      const { data: usersData } = await supabase
        .from('users')
        .select('id')
        .eq('garage_id', garageId)
        .eq('role', 'mechanic');
      
      if (usersData && usersData.length > 0) {
        const userIds = usersData.map((u: any) => u.id);
        const { data: mechanicsData } = await (supabase as any)
          .from('mechanics')
          .select('*')
          .in('user_id', userIds);
        if (mechanicsData) {
          setMechanics(mechanicsData as Mechanic[]);
        }
      }
    } catch (err) {
      console.error('Error loading mechanics:', err);
    }
  }, [garageId, supabase]);

  const loadInventoryItems = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');
      if (data) {
        setInventoryItems(data as InventoryItem[]);
      }
    } catch (err) {
      console.error('Error loading inventory items:', err);
    }
  }, [supabase]);

  useEffect(() => {
    loadWorkOrder();
  }, [loadWorkOrder]);

  useEffect(() => {
    if (garageId) {
      loadParts();
      loadMechanics();
    }
  }, [garageId, loadParts, loadMechanics]);

  useEffect(() => {
    loadInventoryItems();
  }, [loadInventoryItems]);

  useEffect(() => {
    if (!workOrderId) return;

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
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setWorkOrder(payload.new as unknown as WorkOrder);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workOrderId, supabase]);

  const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    if (!workOrder) return;
    try {
      setUpdating(true);
      setError(null);
      const updates: Partial<WorkOrder> = { status: newStatus };
      
      // If closing, set closed_at
      if (newStatus === WorkOrderStatus.CLOSED) {
        updates.closed_at = new Date().toISOString();
      } else if (workOrder.status === WorkOrderStatus.CLOSED && newStatus !== WorkOrderStatus.CLOSED) {
        updates.closed_at = undefined;
      }

      await updateWorkOrder(workOrder.id, updates);
      setWorkOrder({ ...workOrder, ...updates });
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: WorkOrderPriority) => {
    if (!workOrder) return;
    try {
      setUpdating(true);
      setError(null);
      await updateWorkOrder(workOrder.id, { priority: newPriority });
      setWorkOrder({ ...workOrder, priority: newPriority });
    } catch (err: any) {
      setError(err.message || 'Failed to update priority');
    } finally {
      setUpdating(false);
    }
  };

  const handleHoursUpdate = async (field: 'estimated_hours' | 'actual_hours', value: number) => {
    if (!workOrder) return;
    try {
      setUpdating(true);
      setError(null);
      await updateWorkOrder(workOrder.id, { [field]: value });
      setWorkOrder({ ...workOrder, [field]: value });
    } catch (err: any) {
      setError(err.message || 'Failed to update hours');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditSave = async (updates: { title?: string; description?: string }) => {
    if (!workOrder) return;
    try {
      setUpdating(true);
      setError(null);
      await updateWorkOrder(workOrder.id, updates);
      setWorkOrder({ ...workOrder, ...updates });
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update work order');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignmentSuccess = () => {
    loadWorkOrder();
    setShowAssignModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-slate-500">Loading work order...</p>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Work order not found</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    Open: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    Waiting: 'bg-yellow-100 text-yellow-700',
    Closed: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const priorityColors = {
    P0: 'bg-red-100 text-red-700',
    P1: 'bg-orange-100 text-orange-700',
    P2: 'bg-yellow-100 text-yellow-700',
    P3: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Work Order Management</h1>
              <p className="text-slate-500">ID: {workOrder.id.slice(0, 8)}...</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Work Order Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {editing ? (
                    <EditWorkOrderForm
                      workOrder={workOrder}
                      onSave={handleEditSave}
                      onCancel={() => setEditing(false)}
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-slate-900">{workOrder.title}</h2>
                        <button
                          onClick={() => setEditing(true)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                      {workOrder.description && (
                        <p className="text-slate-600 whitespace-pre-wrap">{workOrder.description}</p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${priorityColors[workOrder.priority]}`}>
                    {workOrder.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[workOrder.status]}`}>
                    {workOrder.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-500">Type</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">{workOrder.type}</p>
                </div>
                {workOrder.issue_type && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Issue Type</p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{workOrder.issue_type}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-500">Created</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {format(new Date(workOrder.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                {workOrder.closed_at && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Closed</p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {format(new Date(workOrder.closed_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Parts Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CubeIcon className="h-5 w-5 text-slate-500" />
                  Parts & Inventory
                </h2>
                <button
                  onClick={() => setShowPartsModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium"
                >
                  Add Parts
                </button>
              </div>

              {parts.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CubeIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No parts assigned to this work order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {parts.map((part) => (
                    <div
                      key={part.id}
                      className="p-4 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {part.item?.name || 'Unknown Part'}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            SKU: {part.item?.sku || 'N/A'} • Quantity: {part.quantity}
                          </p>
                          {part.stock && (
                            <p className={`text-xs mt-2 ${
                              part.stock.quantity_on_hand < (part.item?.min_threshold || 0)
                                ? 'text-red-600'
                                : 'text-slate-500'
                            }`}>
                              Stock: {part.stock.quantity_on_hand} on hand
                              {part.stock.quantity_on_hand < (part.item?.min_threshold || 0) && ' (LOW STOCK)'}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await supabase
                                .from('work_order_parts')
                                .delete()
                                .eq('id', part.id);
                              loadParts();
                            } catch (err) {
                              console.error('Error removing part:', err);
                            }
                          }}
                          className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-6">
            {/* Status & Priority Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-slate-500" />
                Status & Priority
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={workOrder.status}
                    onChange={(e) => handleStatusChange(e.target.value as WorkOrderStatus)}
                    disabled={updating}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                  <select
                    value={workOrder.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as WorkOrderPriority)}
                    disabled={updating}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="P0">P0 - Critical</option>
                    <option value="P1">P1 - High</option>
                    <option value="P2">P2 - Medium</option>
                    <option value="P3">P3 - Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hours Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-slate-500" />
                Time Tracking
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={workOrder.estimated_hours || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        handleHoursUpdate('estimated_hours', value);
                      }
                    }}
                    disabled={updating}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Actual Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={workOrder.actual_hours || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        handleHoursUpdate('actual_hours', value);
                      }
                    }}
                    disabled={updating}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>

            {/* Assignment Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <WrenchScrewdriverIcon className="h-5 w-5 text-slate-500" />
                Assignment
              </h2>

              {workOrder.assigned_mechanic_id ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Assigned to mechanic: {workOrder.assigned_mechanic_id.slice(0, 8)}...
                  </p>
                  <button
                    onClick={() => {
                      updateWorkOrder(workOrder.id, { assigned_mechanic_id: null });
                      setWorkOrder({ ...workOrder, assigned_mechanic_id: undefined });
                    }}
                    className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
                  >
                    Unassign
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-600 mb-3">No mechanic assigned</p>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium"
                  >
                    Assign Mechanic
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && workOrder && (
        <WorkOrderAssignmentModal
          workOrder={workOrder}
          mechanics={mechanics}
          garageId={garageId || undefined}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleAssignmentSuccess}
        />
      )}

      {/* Parts Modal */}
      {showPartsModal && (
        <PartsModal
          workOrderId={workOrderId}
          garageId={garageId || ''}
          inventoryItems={inventoryItems}
          onClose={() => setShowPartsModal(false)}
          onSuccess={() => {
            loadParts();
            setShowPartsModal(false);
          }}
        />
      )}
    </div>
  );
}

// Edit Work Order Form Component
function EditWorkOrderForm({ 
  workOrder, 
  onSave, 
  onCancel 
}: { 
  workOrder: WorkOrder; 
  onSave: (updates: { title?: string; description?: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(workOrder.title);
  const [description, setDescription] = useState(workOrder.description || '');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ title, description })}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// Parts Modal Component
function PartsModal({
  workOrderId,
  garageId,
  inventoryItems,
  onClose,
  onSuccess,
}: {
  workOrderId: string;
  garageId: string;
  inventoryItems: InventoryItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleAddPart = async () => {
    if (!selectedItemId || quantity < 1) return;

    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from('work_order_parts')
        .insert({
          work_order_id: workOrderId,
          inventory_item_id: selectedItemId,
          quantity,
          garage_id: garageId,
        });

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      console.error('Error adding part:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Add Parts</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Part</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a part...</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPart}
                disabled={loading || !selectedItemId}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Part'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

