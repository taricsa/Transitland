'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeDashboard } from '@/lib/hooks/useRealtimeDashboard';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { SyncStatus } from '@/components/ui/SyncStatus';
import { handleLogout } from '@/lib/utils/logout';
import { WorkOrder, Vehicle, WorkOrderPriority, Garage, Mechanic } from '@/types';
import { WorkOrderAssignmentModal } from '@/components/features/work-orders/WorkOrderAssignmentModal';

// Icons
import { 
  TruckIcon, 
  WrenchScrewdriverIcon, 
  ExclamationTriangleIcon, 
  CalendarIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function OpsDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [garageId, setGarageId] = useState<string | undefined>();
  const [selectedGarageId, setSelectedGarageId] = useState<string | undefined>();
  const [garages, setGarages] = useState<Garage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningWorkOrder, setAssigningWorkOrder] = useState<WorkOrder | null>(null);

  // 1. Preserve Existing Data Fetching
  const { vehicles, workOrders, mechanics, metrics, loading } = useRealtimeDashboard(selectedGarageId);

  // 2. Load garages and set initial garage context
  useEffect(() => {
    async function loadGarages() {
      const { data: garagesData } = await supabase
        .from('garages')
        .select('*')
        .order('name');
      if (garagesData) {
        setGarages(garagesData as Garage[]);
      }
    }
    loadGarages();
  }, [supabase]);

  // 3. Preserve Garage Context Logic (for initial user garage)
  useEffect(() => {
    async function getGarageId() {
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
            // Set as initial selected garage if none selected yet
            if (!selectedGarageId) {
              setSelectedGarageId(typedUserData.garage_id);
            }
          }
        }
      }
    }
    getGarageId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Derived State (Mapping Real Data to V2 UI)
  // We filter the real 'workOrders' to find unassigned P0/P1 tasks for the Triage Queue
  const triageQueue = workOrders 
    ? workOrders.filter(wo => 
        (wo.priority === WorkOrderPriority.P0 || wo.priority === WorkOrderPriority.P1) && 
        !wo.assigned_mechanic_id
      )
    : [];

  // We filter vehicles based on search (search by VIN, make, model, or ID)
  const filteredVehicles = vehicles 
    ? vehicles.filter(v => {
        const searchLower = searchTerm.toLowerCase();
        return (
          v.vin.toLowerCase().includes(searchLower) || 
          v.id.toLowerCase().includes(searchLower) ||
          (v.make && v.make.toLowerCase().includes(searchLower)) ||
          (v.model && v.model.toLowerCase().includes(searchLower))
        );
      })
    : [];

  const handleNewWorkOrder = () => {
    router.push('/ops/work-orders/new');
  };

  const handleAssignWorkOrder = (workOrder: WorkOrder) => {
    setAssigningWorkOrder(workOrder);
  };

  const handleAssignmentSuccess = () => {
    // Refresh data will happen automatically via real-time subscriptions
    setAssigningWorkOrder(null);
  };

  const handleVehicleManage = (vehicleId: string) => {
    router.push(`/ops/vehicles/${vehicleId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      <OfflineIndicator />
      
      {/* HEADER: Context & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Control Tower</h1>
            <p className="text-slate-500">Real-time Operations Command</p>
          </div>
          {/* Garage Selector */}
          <div className="mt-6 md:mt-0">
            <select
              value={selectedGarageId || 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedGarageId(value === 'all' ? undefined : value);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Garages</option>
              {garages.map((garage) => (
                <option key={garage.id} value={garage.id}>
                  {garage.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <SyncStatus />
          
          <div className="h-6 w-px bg-slate-300 mx-2" /> {/* Divider */}

          <button 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm transition-all"
            onClick={() => router.push('/ops/schedule')}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Plan Schedule</span>
          </button>
          
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 shadow-md shadow-blue-200 transition-all"
            onClick={handleNewWorkOrder}
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">New Work Order</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 ml-2"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-slate-500">Syncing live fleet data...</p>
        </div>
      ) : (
        <>
          {/* KPI GRID: Actionable Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Availability */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-400 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Fleet Availability</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">
                    {metrics?.availabilityRate ? `${Math.round(metrics.availabilityRate)}%` : '--%'}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><TruckIcon className="w-6 h-6" /></div>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">
                {metrics?.outOfServiceVehicles || 0} vehicles down
              </p>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-blue-500 transition-all group-hover:w-full" />
            </div>

            {/* Critical Issues (Triage Link) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-red-400 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Critical Issues</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">{triageQueue.length}</h3>
                </div>
                <div className="p-3 rounded-xl bg-red-50 text-red-600"><ExclamationTriangleIcon className="w-6 h-6" /></div>
              </div>
              <p className="mt-4 text-sm font-medium text-red-600">Unassigned P0/P1 Jobs</p>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-red-500 transition-all group-hover:w-full" />
            </div>

            {/* MTTR (Mean Time To Repair) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-400 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Mean Time To Repair</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">
                    {metrics?.mttr ? `${metrics.mttr.toFixed(1)} hrs` : 'N/A'}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600"><ClockIcon className="w-6 h-6" /></div>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">Average repair time</p>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-indigo-500 transition-all group-hover:w-full" />
            </div>

            {/* Mechanic Load */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-amber-400 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Active Wrench</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">
                    {mechanics ? mechanics.length : 0}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><WrenchScrewdriverIcon className="w-6 h-6" /></div>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">Mechanics on shift</p>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-amber-500 transition-all group-hover:w-full" />
            </div>
          </div>

          {/* MAIN CONTENT SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: Triage Queue (Replaces Static List) */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  Triage Queue
                </h2>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                  {triageQueue.length} Pending
                </span>
              </div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {triageQueue.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p>No unassigned critical tasks.</p>
                    <p className="text-xs">Great job!</p>
                  </div>
                ) : (
                  triageQueue.map((task) => (
                    <div 
                      key={task.id} 
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">{task.title}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                          task.priority === WorkOrderPriority.P0 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description || 'No description'}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">
                          Created {new Date(task.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <button 
                          className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignWorkOrder(task);
                          }}
                        >
                          Assign →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT: Fleet Master Grid (Replaces Map Component) */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 text-slate-500" />
                  Fleet Status
                </h2>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by VIN, ID, make, or model..." 
                    className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 bg-white text-slate-900 placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4">Make/Model</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Details</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVehicles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          {searchTerm ? 'No vehicles found matching your search.' : 'No vehicles available.'}
                        </td>
                      </tr>
                    ) : (
                      filteredVehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{v.vin}</div>
                            <div className="text-xs text-slate-400">{v.id.slice(0, 8)}...</div>
                          </td>
                          <td className="px-6 py-4">
                            {v.make && v.model ? `${v.make} ${v.model}` : v.make || v.model || 'N/A'}
                            {v.year && <span className="text-slate-400 ml-1">({v.year})</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              v.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                              v.status === 'IN_MAINTENANCE' ? 'bg-amber-100 text-amber-700' :
                              v.status === 'IN_SERVICE' ? 'bg-blue-100 text-blue-700' :
                              v.status === 'MAINTENANCE_DUE' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                v.status === 'AVAILABLE' ? 'bg-emerald-500' :
                                v.status === 'IN_MAINTENANCE' ? 'bg-amber-500' :
                                v.status === 'IN_SERVICE' ? 'bg-blue-500' :
                                v.status === 'MAINTENANCE_DUE' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`} />
                              {v.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {v.winterized_bool ? (
                              <span className="text-emerald-600 flex items-center gap-1">❄️ Winterized</span>
                            ) : (
                              <span className="text-slate-400">Standard</span>
                            )}
                            {v.odometer > 0 && (
                              <div className="text-slate-500 mt-1">{v.odometer.toLocaleString()} mi</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              className="text-blue-600 hover:text-blue-800 font-medium"
                              onClick={() => handleVehicleManage(v.id)}
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Work Order Assignment Modal */}
      {assigningWorkOrder && (
        <WorkOrderAssignmentModal
          workOrder={assigningWorkOrder}
          mechanics={mechanics || []}
          garageId={selectedGarageId}
          onClose={() => setAssigningWorkOrder(null)}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  );
}
