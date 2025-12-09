'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InventoryStock, InventoryItem } from '@/types';

export function useInventory(garageId?: string) {
  const [inventory, setInventory] = useState<(InventoryStock & { item: InventoryItem })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('inventory_stock')
        .select(`
          *,
          inventory_items (*)
        `)
        .order('quantity_on_hand', { ascending: true });

      if (garageId) {
        query = query.eq('garage_id', garageId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInventory((data || []) as (InventoryStock & { item: InventoryItem })[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [garageId, supabase]);

  useEffect(() => {
    loadInventory();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_stock',
          filter: garageId ? `garage_id=eq.${garageId}` : undefined,
        },
        () => {
          loadInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [garageId, loadInventory, supabase]);


  const updateStock = async (
    inventoryItemId: string,
    garageId: string,
    quantity: number
  ) => {
    try {
      const { data, error } = await supabase
        .from('inventory_stock')
        .upsert({
          inventory_item_id: inventoryItemId,
          garage_id: garageId,
          quantity_on_hand: quantity,
          updated_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (error) throw error;
      await loadInventory();
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const restock = async (
    inventoryItemId: string,
    garageId: string,
    quantity: number
  ) => {
    try {
      // Get current stock
      const { data: currentStock } = await supabase
        .from('inventory_stock')
        .select('quantity_on_hand')
        .eq('inventory_item_id', inventoryItemId)
        .eq('garage_id', garageId)
        .single();

      const typedCurrentStock = currentStock as { quantity_on_hand?: number } | null;
      const currentQuantity = typedCurrentStock?.quantity_on_hand ?? 0;
      const newQuantity = currentQuantity + quantity;

      return await updateStock(inventoryItemId, garageId, newQuantity);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const getLowStockItems = () => {
    return inventory.filter((item) => {
      const threshold = item.item.min_threshold;
      return item.quantity_on_hand <= threshold;
    });
  };

  const getCriticalStockItems = () => {
    return inventory.filter((item) => {
      return item.quantity_on_hand === 0;
    });
  };

  return {
    inventory,
    loading,
    error,
    updateStock,
    restock,
    getLowStockItems,
    getCriticalStockItems,
    refresh: loadInventory,
  };
}

