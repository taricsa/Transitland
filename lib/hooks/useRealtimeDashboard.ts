'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Vehicle, WorkOrder, Mechanic } from '@/types';

export interface DashboardMetrics {
  totalVehicles: number;
  availableVehicles: number;
  inServiceVehicles: number;
  inMaintenanceVehicles: number;
  outOfServiceVehicles: number;
  availabilityRate: number;
  mechanicUtilization: number;
  winterReadiness: number;
  mttr: number; // Mean Time To Repair in hours
  openWorkOrders: number;
  criticalWorkOrders: number;
}

export function useRealtimeDashboard(garageId?: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalVehicles: 0,
    availableVehicles: 0,
    inServiceVehicles: 0,
    inMaintenanceVehicles: 0,
    outOfServiceVehicles: 0,
    availabilityRate: 0,
    mechanicUtilization: 0,
    winterReadiness: 0,
    mttr: 0,
    openWorkOrders: 0,
    criticalWorkOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garageId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load vehicles
      let vehiclesQuery = supabase.from('vehicles').select('*');
      if (garageId) {
        vehiclesQuery = vehiclesQuery.eq('garage_id', garageId);
      }
      const { data: vehiclesData } = await vehiclesQuery;
      setVehicles((vehiclesData || []) as Vehicle[]);

      // Load work orders
      let workOrdersQuery = supabase.from('work_orders').select('*');
      if (garageId) {
        // Get vehicles for this garage first
        const { data: garageVehicles } = await supabase
          .from('vehicles')
          .select('id')
          .eq('garage_id', garageId);
        if (garageVehicles) {
          const vehicleIds = garageVehicles.map((v: any) => v.id);
          workOrdersQuery = (workOrdersQuery as any).in(
            'vehicle_id',
            vehicleIds
          );
        }
      }
      const { data: workOrdersData } = await workOrdersQuery;
      setWorkOrders((workOrdersData || []) as WorkOrder[]);

      // Load mechanics
      if (garageId) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id')
          .eq('garage_id', garageId)
          .eq('role', 'mechanic');
        if (usersData) {
          const userIds = usersData.map((u: any) => u.id);
          const { data: mechanicsData } = await (supabase as any)
            .from('mechanics')
            .select('*')
            .in('user_id', userIds);
          setMechanics((mechanicsData || []) as Mechanic[]);
        } else {
          setMechanics([]);
        }
      } else {
        // Load all mechanics when "All" is selected
        const { data: usersData } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'mechanic');
        if (usersData) {
          const userIds = usersData.map((u: any) => u.id);
          if (userIds.length > 0) {
            const { data: mechanicsData } = await (supabase as any)
              .from('mechanics')
              .select('*')
              .in('user_id', userIds);
            setMechanics((mechanicsData || []) as Mechanic[]);
          } else {
            setMechanics([]);
          }
        } else {
          setMechanics([]);
        }
      }

      await calculateMetrics();
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = async () => {
    const total = vehicles.length;
    const available = vehicles.filter((v) => v.status === 'AVAILABLE').length;
    const inService = vehicles.filter((v) => v.status === 'IN_SERVICE').length;
    const inMaintenance = vehicles.filter((v) => v.status === 'IN_MAINTENANCE').length;
    const outOfService = vehicles.filter((v) => v.status === 'OUT_OF_SERVICE').length;
    const availabilityRate = total > 0 ? (available / total) * 100 : 0;

    const openWOs = workOrders.filter(
      (wo) => wo.status !== 'Closed' && wo.status !== 'Cancelled'
    ).length;
    const criticalWOs = workOrders.filter((wo) => wo.priority === 'P0').length;

    // Calculate mechanic utilization (simplified - would need actual hours data)
    const activeMechanics = mechanics.length;
    const assignedWOs = workOrders.filter((wo) => wo.assigned_mechanic_id).length;
    const mechanicUtilization = activeMechanics > 0 ? (assignedWOs / activeMechanics) * 100 : 0;

    // Calculate winter readiness
    const winterized = vehicles.filter((v) => v.winterized_bool).length;
    const winterReadiness = total > 0 ? (winterized / total) * 100 : 0;

    // Calculate MTTR (Mean Time To Repair) - average hours from created_at to closed_at for closed work orders
    let mttr = 0;
    const closedWorkOrders = workOrders.filter(
      (wo) => wo.status === 'Closed' && wo.closed_at
    );
    if (closedWorkOrders.length > 0) {
      const totalHours = closedWorkOrders.reduce((sum, wo) => {
        if (wo.closed_at && wo.created_at) {
          const created = new Date(wo.created_at).getTime();
          const closed = new Date(wo.closed_at).getTime();
          const hours = (closed - created) / (1000 * 60 * 60); // Convert ms to hours
          return sum + hours;
        }
        return sum;
      }, 0);
      mttr = totalHours / closedWorkOrders.length;
    }

    setMetrics({
      totalVehicles: total,
      availableVehicles: available,
      inServiceVehicles: inService,
      inMaintenanceVehicles: inMaintenance,
      outOfServiceVehicles: outOfService,
      availabilityRate,
      mechanicUtilization,
      winterReadiness,
      mttr,
      openWorkOrders: openWOs,
      criticalWorkOrders: criticalWOs,
    });
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to vehicle changes
    const vehiclesChannel = supabase
      .channel('dashboard_vehicles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles',
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    // Subscribe to work order changes
    const workOrdersChannel = supabase
      .channel('dashboard_work_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders',
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vehiclesChannel);
      supabase.removeChannel(workOrdersChannel);
    };
  };

  useEffect(() => {
    calculateMetrics().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, workOrders, mechanics]);

  return {
    vehicles,
    workOrders,
    mechanics,
    metrics,
    loading,
    refresh: loadData,
  };
}

