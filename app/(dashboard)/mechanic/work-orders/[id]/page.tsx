'use client';

export const dynamic = 'force-dynamic';
// Work order detail page for mechanics

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WorkOrder, WorkOrderStatus, WorkOrderPart, InventoryItem, InventoryStock, Vehicle } from '@/types';
import { useWorkOrders } from '@/lib/hooks/useWorkOrders';
import { format } from 'date-fns';
import { 
  ArrowLeftIcon,
  ClockIcon,
  CubeTransparentIcon,
  TruckIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface EnrichedWorkOrderPart extends WorkOrderPart {
  item?: InventoryItem;
  stock?: InventoryStock;
}

interface WorkOrderPhoto {
  id: string;
  url: string;
  uploaded_at: string;
  uploaded_by?: string;
}

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workOrderId = params.id as string;
  const supabase = createClient();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [parts, setParts] = useState<EnrichedWorkOrderPart[]>([]);
  const [photos, setPhotos] = useState<WorkOrderPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [garageId, setGarageId] = useState<string | undefined>();
  const { updateWorkOrder } = useWorkOrders();

  // Modal states
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isPhotoUploadModalOpen, setIsPhotoUploadModalOpen] = useState(false);
  const [availableInventoryItems, setAvailableInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedNewPart, setSelectedNewPart] = useState<string>('');
  const [newPartQuantity, setNewPartQuantity] = useState<number>(1);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadWorkOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: woError } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', workOrderId)
        .single();

      if (woError) throw woError;
      const typedWorkOrder = data as WorkOrder;
      setWorkOrder(typedWorkOrder);

      // Load vehicle
      if (typedWorkOrder.vehicle_id) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', typedWorkOrder.vehicle_id)
          .single();
        
        if (vehicleError) throw vehicleError;
        const typedVehicle = vehicleData as Vehicle;
        setVehicle(typedVehicle);
        setGarageId(typedVehicle.garage_id);
      }
    } catch (err: any) {
      console.error('Error loading work order:', err);
      setError(err.message || 'Failed to load work order');
    } finally {
      setLoading(false);
    }
  }, [workOrderId, supabase]);

  const loadParts = useCallback(async () => {
    if (!workOrderId || !garageId) return;

    try {
      const { data: workOrderPartsData, error: partsError } = await supabase
        .from('work_order_parts')
        .select('*')
        .eq('work_order_id', workOrderId);

      if (partsError) throw partsError;

      if (workOrderPartsData) {
        const typedParts = workOrderPartsData as WorkOrderPart[];
        const partsWithDetails = await Promise.all(
          typedParts.map(async (part) => {
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
    } catch (err: any) {
      console.error('Error loading parts:', err);
    }
  }, [workOrderId, garageId, supabase]);

  const loadPhotos = useCallback(async () => {
    if (!workOrderId) return;

    try {
      // Load photo events from work_order_events
      const { data: photoEvents, error: eventsError } = await supabase
        .from('work_order_events')
        .select('*')
        .eq('work_order_id', workOrderId)
        .eq('event_type', 'Photo Added')
        .order('timestamp', { ascending: false });

      if (eventsError) throw eventsError;

      if (photoEvents) {
        const photoList: WorkOrderPhoto[] = photoEvents.map((event: any) => ({
          id: event.id,
          url: event.metadata?.url || event.metadata?.photo_url || '',
          uploaded_at: event.timestamp,
          uploaded_by: event.user_id,
        })).filter((photo: WorkOrderPhoto) => photo.url); // Filter out invalid photos

        setPhotos(photoList);
      }
    } catch (err: any) {
      console.error('Error loading photos:', err);
    }
  }, [workOrderId, supabase]);

  useEffect(() => {
    loadWorkOrder();
    loadParts();
    loadPhotos();

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

    const partsChannel = supabase
      .channel(`work_order_parts_${workOrderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_order_parts',
          filter: `work_order_id=eq.${workOrderId}`,
        },
        () => {
          loadParts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(partsChannel);
    };
  }, [workOrderId, supabase, loadWorkOrder, loadParts, loadPhotos]);

  // Load available inventory items for the add part modal
  useEffect(() => {
    async function loadInventoryItems() {
      if (!garageId) return;
      const { data, error: itemsError } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');
      if (itemsError) {
        console.error('Error loading inventory items:', itemsError);
      } else {
        setAvailableInventoryItems(data || []);
      }
    }
    loadInventoryItems();
  }, [garageId, supabase]);

  const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    if (!workOrder) return;
    try {
      setUpdating(true);
      setError(null);
      const updates: Partial<WorkOrder> = { status: newStatus };
      
      if (newStatus === WorkOrderStatus.CLOSED) {
        updates.closed_at = new Date().toISOString();
      } else if (workOrder.status === WorkOrderStatus.CLOSED) {
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

  const handleActualHoursChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workOrder) return;
    const newHours = parseFloat(e.target.value);
    if (isNaN(newHours) || newHours < 0) return;
    if (newHours === workOrder.actual_hours) return;

    try {
      setUpdating(true);
      setError(null);
      await updateWorkOrder(workOrder.id, { actual_hours: newHours });
      setWorkOrder({ ...workOrder, actual_hours: newHours });
    } catch (err: any) {
      setError(err.message || 'Failed to update actual hours');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddPart = async () => {
    if (!workOrder || !selectedNewPart || newPartQuantity <= 0 || !garageId) {
      setError('Please select a part and enter a valid quantity.');
      return;
    }
    try {
      setUpdating(true);
      setError(null);
      const { error: insertError } = await (supabase as any)
        .from('work_order_parts')
        .insert({
          work_order_id: workOrder.id,
          inventory_item_id: selectedNewPart,
          quantity: newPartQuantity,
          garage_id: garageId,
        });
      if (insertError) throw insertError;
      
      setIsAddPartModalOpen(false);
      setSelectedNewPart('');
      setNewPartQuantity(1);
      loadParts();
    } catch (err: any) {
      setError(err.message || 'Failed to add part.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemovePart = async (partId: string) => {
    if (!workOrder) return;
    try {
      setUpdating(true);
      setError(null);
      const { error: deleteError } = await supabase.from('work_order_parts').delete().eq('id', partId);
      if (deleteError) throw deleteError;
      loadParts();
    } catch (err: any) {
      setError(err.message || 'Failed to remove part.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!workOrder || !file) return;

    try {
      setUploadingPhoto(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${workOrderId}/${Date.now()}.${fileExt}`;
      const filePath = `work-orders/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('work-order-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('work-order-photos')
        .getPublicUrl(filePath);

      // Create work_order_event for photo
      const { error: eventError } = await (supabase as any)
        .from('work_order_events')
        .insert({
          work_order_id: workOrder.id,
          event_type: 'Photo Added',
          user_id: user.id,
          metadata: {
            url: publicUrl,
            file_name: file.name,
            file_path: filePath,
          },
        });

      if (eventError) throw eventError;

      setIsPhotoUploadModalOpen(false);
      loadPhotos();
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    if (!workOrder) return;

    try {
      setUpdating(true);
      setError(null);

      // Extract file path from URL and delete from storage
      const urlParts = photoUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('work-order-photos') + 1).join('/');
      
      const { error: deleteError } = await supabase.storage
        .from('work-order-photos')
        .remove([filePath]);

      if (deleteError) {
        console.warn('Error deleting file from storage:', deleteError);
        // Continue to delete the event even if file deletion fails
      }

      // Delete the event
      const { error: eventError } = await supabase
        .from('work_order_events')
        .delete()
        .eq('id', photoId);

      if (eventError) throw eventError;

      loadPhotos();
    } catch (err: any) {
      setError(err.message || 'Failed to delete photo.');
    } finally {
      setUpdating(false);
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

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
                  disabled={updating}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
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
            {/* Vehicle Identification */}
            {vehicle && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TruckIcon className="h-5 w-5 text-gray-500" />
                  Vehicle Information
                </h2>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">VIN</dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900">{vehicle.vin}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Make/Model</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Odometer</dt>
                    <dd className="mt-1 text-sm text-gray-900">{vehicle.odometer.toLocaleString()} mi</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">{vehicle.status}</dd>
                  </div>
                </dl>
              </div>
            )}

            {/* Details */}
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
                <div>
                  <dt className="text-sm font-medium text-gray-500">Actual Hours</dt>
                  <dd className="mt-1">
                    <input
                      type="number"
                      value={workOrder.actual_hours || ''}
                      onChange={handleActualHoursChange}
                      onBlur={handleActualHoursChange}
                      disabled={updating}
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </dd>
                </div>
              </dl>
            </div>

            {/* Description */}
            {workOrder.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{workOrder.description}</p>
              </div>
            )}

            {/* Parts Used */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CubeTransparentIcon className="h-5 w-5 text-gray-500" />
                  Parts Used
                </h2>
                <button
                  onClick={() => setIsAddPartModalOpen(true)}
                  disabled={updating || !garageId}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Part
                </button>
              </div>

              {parts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CubeTransparentIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No parts recorded for this work order.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {parts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">{part.item?.name || 'Unknown Part'}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {part.quantity} • SKU: {part.item?.sku || 'N/A'}
                        </p>
                        {part.stock && part.stock.quantity_on_hand < (part.item?.min_threshold || 0) && (
                          <p className="text-xs text-red-600 mt-1">⚠️ Low Stock: {part.stock.quantity_on_hand} on hand</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemovePart(part.id)}
                        disabled={updating}
                        className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <PhotoIcon className="h-5 w-5 text-gray-500" />
                  Photos
                </h2>
                <button
                  onClick={() => setIsPhotoUploadModalOpen(true)}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Photo
                </button>
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No photos added to this work order.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt="Work order photo"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => handleDeletePhoto(photo.id, photo.url)}
                        disabled={updating}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(photo.uploaded_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Part Modal */}
      <Transition appear show={isAddPartModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsAddPartModalOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Add Part to Work Order
                  </DialogTitle>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="part-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Select Part
                      </label>
                      <select
                        id="part-select"
                        value={selectedNewPart}
                        onChange={(e) => setSelectedNewPart(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Choose a part...</option>
                        {availableInventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="part-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        id="part-quantity"
                        value={newPartQuantity}
                        onChange={(e) => setNewPartQuantity(parseInt(e.target.value) || 1)}
                        min="1"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setIsAddPartModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleAddPart}
                      disabled={updating || !selectedNewPart || newPartQuantity <= 0}
                    >
                      {updating ? 'Adding...' : 'Add Part'}
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Photo Upload Modal */}
      <Transition appear show={isPhotoUploadModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsPhotoUploadModalOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Upload Photo
                  </DialogTitle>
                  <div className="mt-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handlePhotoUpload(file);
                        }
                      }}
                      disabled={uploadingPhoto}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    {uploadingPhoto && (
                      <p className="mt-2 text-sm text-gray-500">Uploading...</p>
                    )}
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setIsPhotoUploadModalOpen(false)}
                      disabled={uploadingPhoto}
                    >
                      Close
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
