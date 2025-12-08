'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WorkOrder, WorkOrderStatus, WorkOrderType, WorkOrderPriority } from '@/types';
import { offlineQueue } from '@/lib/utils/offlineQueue';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function useWorkOrders(mechanicId?: string) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    loadWorkOrders();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('work_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders',
          filter: mechanicId ? `assigned_mechanic_id=eq.${mechanicId}` : undefined,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setWorkOrders((prev) => [payload.new as WorkOrder, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setWorkOrders((prev) =>
              prev.map((wo) => (wo.id === payload.new.id ? (payload.new as WorkOrder) : wo))
            );
          } else if (payload.eventType === 'DELETE') {
            setWorkOrders((prev) => prev.filter((wo) => wo.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mechanicId]);

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      let query = supabase.from('work_orders').select('*').order('created_at', { ascending: false });

      if (mechanicId) {
        query = query.eq('assigned_mechanic_id', mechanicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWorkOrders((data || []) as WorkOrder[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkOrder = async (workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!isOnline) {
        // Queue for offline sync
        offlineQueue.enqueue({
          table: 'work_orders',
          operation: 'INSERT',
          data: workOrder,
        });
        // Optimistically add to local state
        const optimisticWO: WorkOrder = {
          ...workOrder,
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setWorkOrders((prev) => [optimisticWO, ...prev]);
        return optimisticWO;
      }

      const { data, error } = await supabase
        .from('work_orders')
        .insert(workOrder)
        .select()
        .single();

      if (error) throw error;
      const newWO = data as WorkOrder;
      setWorkOrders((prev) => [newWO, ...prev]);
      return newWO;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>) => {
    try {
      if (!isOnline) {
        offlineQueue.enqueue({
          table: 'work_orders',
          operation: 'UPDATE',
          data: { id, ...updates },
        });
        setWorkOrders((prev) =>
          prev.map((wo) => (wo.id === id ? { ...wo, ...updates } : wo))
        );
        return;
      }

      const { data, error } = await supabase
        .from('work_orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updatedWO = data as WorkOrder;
      setWorkOrders((prev) =>
        prev.map((wo) => (wo.id === id ? updatedWO : wo))
      );
      return updatedWO;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteWorkOrder = async (id: string) => {
    try {
      if (!isOnline) {
        offlineQueue.enqueue({
          table: 'work_orders',
          operation: 'DELETE',
          data: { id },
        });
        setWorkOrders((prev) => prev.filter((wo) => wo.id !== id));
        return;
      }

      const { error } = await supabase.from('work_orders').delete().eq('id', id);

      if (error) throw error;
      setWorkOrders((prev) => prev.filter((wo) => wo.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    workOrders,
    loading,
    error,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    refresh: loadWorkOrders,
  };
}

