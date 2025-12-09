'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Vehicle, WorkOrder, VehicleStatus, Garage } from '@/types';
import { vehicleService } from '@/lib/services/vehicles';
import { getValidNextStates } from '@/lib/utils/vehicleStateMachine';
import { format } from 'date-fns';
import { 
  ArrowLeftIcon, 
  TruckIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  DocumentTextIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { handleLogout } from '@/lib/utils/logout';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function VehicleManagementPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;
  const supabase = createClient();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [garage, setGarage] = useState<Garage | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validNextStates, setValidNextStates] = useState<VehicleStatus[]>([]);

  useEffect(() => {
    loadVehicleData();
  }, [vehicleId]);

  const loadVehicleData = async () => {
    try {
      setLoading(true);
      
      // Load vehicle
      const vehicleData = await vehicleService.getVehicleById(vehicleId);
      if (!vehicleData) {
        setError('Vehicle not found');
        return;
      }
      setVehicle(vehicleData);
      setValidNextStates(getValidNextStates(vehicleData.status, vehicleData));

      // Load garage
      const { data: garageData } = await supabase
        .from('garages')
        .select('*')
        .eq('id', vehicleData.garage_id)
        .single();
      if (garageData) {
        setGarage(garageData as Garage);
      }

      // Load work orders for this vehicle
      const { data: workOrdersData } = await supabase
        .from('work_orders')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });
      if (workOrdersData) {
        setWorkOrders(workOrdersData as WorkOrder[]);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: VehicleStatus) => {
    if (!vehicle) return;
    
    try {
      setUpdating(true);
      setError(null);
      const updatedVehicle = await vehicleService.updateVehicleStatus(
        vehicle.id,
        newStatus,
        vehicle.status
      );
      setVehicle(updatedVehicle);
      setValidNextStates(getValidNextStates(newStatus, updatedVehicle));
    } catch (err: any) {
      setError(err.message || 'Failed to update vehicle status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateWorkOrder = () => {
    router.push(`/ops/work-orders/new?vehicleId=${vehicleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-slate-500">Loading vehicle data...</p>
        </div>
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
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

  if (!vehicle) return null;

  const statusColors = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700',
    IN_SERVICE: 'bg-blue-100 text-blue-700',
    MAINTENANCE_DUE: 'bg-yellow-100 text-yellow-700',
    IN_MAINTENANCE: 'bg-amber-100 text-amber-700',
    OUT_OF_SERVICE: 'bg-red-100 text-red-700',
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
              Back to Control Tower
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Vehicle Management</h1>
              <p className="text-slate-500">{vehicle.vin}</p>
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
          {/* Left Column: Vehicle Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {vehicle.make} {vehicle.model} {vehicle.year}
                  </h2>
                  <p className="text-slate-500 mt-1">VIN: {vehicle.vin}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[vehicle.status]}`}>
                  {vehicle.status.replace('_', ' ')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">Garage</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {garage?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Odometer</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {vehicle.odometer.toLocaleString()} mi
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Last Service</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {vehicle.last_service_date 
                      ? format(new Date(vehicle.last_service_date), 'MMM d, yyyy')
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Next Service</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {vehicle.next_service_date 
                      ? format(new Date(vehicle.next_service_date), 'MMM d, yyyy')
                      : vehicle.next_service_miles
                      ? `At ${vehicle.next_service_miles.toLocaleString()} mi`
                      : 'Not scheduled'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Winterized</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {vehicle.winterized_bool ? (
                      <span className="text-emerald-600">❄️ Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Vehicle ID</p>
                  <p className="text-sm font-mono text-slate-600 mt-1">
                    {vehicle.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Work Orders Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-slate-500" />
                  Work Orders
                </h2>
                <button
                  onClick={handleCreateWorkOrder}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium"
                >
                  <PlusIcon className="h-4 w-4" />
                  New Work Order
                </button>
              </div>

              {workOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No work orders for this vehicle</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workOrders.map((wo) => (
                    <div
                      key={wo.id}
                      onClick={() => router.push(`/mechanic/work-orders/${wo.id}`)}
                      className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-200 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">{wo.title}</h3>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                              wo.priority === 'P0'
                                ? 'bg-red-100 text-red-700'
                                : wo.priority === 'P1'
                                ? 'bg-orange-100 text-orange-700'
                                : wo.priority === 'P2'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {wo.priority}
                            </span>
                            <span className="text-xs text-slate-500">{wo.status}</span>
                          </div>
                          {wo.description && (
                            <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                              {wo.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-400">
                            Created {format(new Date(wo.created_at), 'MMM d, yyyy')}
                            {wo.estimated_hours && ` • Est. ${wo.estimated_hours} hrs`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-6">
            {/* Status Update Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-slate-500" />
                Update Status
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Current status: <span className="font-semibold">{vehicle.status.replace('_', ' ')}</span>
              </p>
              
              {validNextStates.length === 0 ? (
                <p className="text-sm text-slate-400">No valid status transitions available</p>
              ) : (
                <div className="space-y-2">
                  {validNextStates.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={updating}
                      className="w-full text-left px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="font-medium text-slate-900">
                        {status.replace('_', ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <WrenchScrewdriverIcon className="h-5 w-5 text-slate-500" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={handleCreateWorkOrder}
                  className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-colors"
                >
                  <div className="font-medium text-slate-900">Create Work Order</div>
                  <div className="text-xs text-slate-500 mt-1">Schedule maintenance or report issue</div>
                </button>
                <button
                  onClick={() => router.push(`/ops/schedule?vehicleId=${vehicleId}`)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-colors"
                >
                  <div className="font-medium text-slate-900">Schedule PM</div>
                  <div className="text-xs text-slate-500 mt-1">Plan preventive maintenance</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

