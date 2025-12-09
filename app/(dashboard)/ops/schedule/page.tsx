'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { handleLogout } from '@/lib/utils/logout';
import { Vehicle, WorkOrder } from '@/types';
import { ArrowLeftIcon, CalendarIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { WorkOrderForm } from '@/components/features/work-orders/WorkOrderForm';

export default function SchedulePage() {
  const router = useRouter();
  const supabase = createClient();
  const [garageId, setGarageId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'pm' | 'work-orders'>('pm');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('garage_id')
          .eq('id', user.id)
          .single();
        if (userData) {
          const typedUserData = userData as { garage_id?: string | null };
          if (typedUserData.garage_id) {
            setGarageId(typedUserData.garage_id);
            await loadVehicles(typedUserData.garage_id);
            await loadWorkOrders(typedUserData.garage_id);
          }
        }
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const loadVehicles = async (gId: string) => {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('garage_id', gId)
      .order('next_service_date', { ascending: true, nullsFirst: false });
    if (data) {
      setVehicles(data as Vehicle[]);
    }
  };

  const loadWorkOrders = async (gId: string) => {
    // Get vehicles for this garage first
    const { data: garageVehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('garage_id', gId);
    
    if (garageVehicles && garageVehicles.length > 0) {
      const vehicleIds = garageVehicles.map((v: any) => v.id);
      const { data } = await (supabase as any)
        .from('work_orders')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .eq('status', 'Open')
        .order('priority', { ascending: true });
      if (data) {
        setWorkOrders(data as WorkOrder[]);
      }
    }
  };

  // Filter vehicles with upcoming service dates (next 30 days)
  const upcomingServiceVehicles = vehicles.filter((v) => {
    if (!v.next_service_date) return false;
    const serviceDate = new Date(v.next_service_date);
    const today = new Date();
    const daysDiff = (serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff >= 0 && daysDiff <= 30;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-slate-500">Loading schedule data...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-slate-900">Schedule Planning</h1>
              <p className="text-slate-500">Plan preventive maintenance and assign work orders</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pm')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pm'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <CalendarIcon className="h-5 w-5 inline mr-2" />
              Preventive Maintenance
            </button>
            <button
              onClick={() => setActiveTab('work-orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'work-orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Work Order Time Slots
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'pm' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Upcoming Service Dates (Next 30 Days)
              </h2>
              <span className="text-sm text-slate-500">
                {upcomingServiceVehicles.length} vehicles
              </span>
            </div>

            {upcomingServiceVehicles.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No vehicles with upcoming service dates in the next 30 days.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingServiceVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {vehicle.vin} - {vehicle.make} {vehicle.model} {vehicle.year}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Service due: {vehicle.next_service_date 
                            ? new Date(vehicle.next_service_date).toLocaleDateString()
                            : 'Not scheduled'}
                          {vehicle.next_service_miles && (
                            <span className="ml-4">
                              ({vehicle.next_service_miles.toLocaleString()} miles)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Current odometer: {vehicle.odometer?.toLocaleString() || 'N/A'} miles
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          // Navigate to create PM work order for this vehicle
                          router.push(`/ops/work-orders/new?vehicleId=${vehicle.id}&type=Preventive`);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500"
                      >
                        Schedule PM
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'work-orders' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Unassigned Work Orders
              </h2>
              <span className="text-sm text-slate-500">
                {workOrders.filter((wo) => !wo.assigned_mechanic_id).length} unassigned
              </span>
            </div>

            {workOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>No open work orders to schedule.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workOrders
                  .filter((wo) => !wo.assigned_mechanic_id)
                  .map((workOrder) => (
                    <div
                      key={workOrder.id}
                      className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">{workOrder.title}</h3>
                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                              workOrder.priority === 'P0'
                                ? 'bg-red-100 text-red-700'
                                : workOrder.priority === 'P1'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {workOrder.priority}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {workOrder.description || 'No description'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Created: {new Date(workOrder.created_at).toLocaleDateString()}
                            {workOrder.estimated_hours && (
                              <span className="ml-4">Est. {workOrder.estimated_hours} hrs</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            router.push(`/mechanic/work-orders/${workOrder.id}`);
                          }}
                          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                        >
                          View & Assign
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

