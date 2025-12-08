'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InventoryItem } from '@/types';
import { createClient } from '@/lib/supabase/client';

const restockSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  location: z.string().optional(),
});

type RestockFormData = z.infer<typeof restockSchema>;

interface RestockFormProps {
  item: InventoryItem;
  garageId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RestockForm({ item, garageId, onSuccess, onCancel }: RestockFormProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RestockFormData>({
    resolver: zodResolver(restockSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  const onSubmit = async (data: RestockFormData) => {
    try {
      setLoading(true);
      // Get current stock
      const { data: currentStock } = await supabase
        .from('inventory_stock')
        .select('quantity_on_hand')
        .eq('inventory_item_id', item.id)
        .eq('garage_id', garageId)
        .single();

      const currentQuantity = (currentStock as { quantity_on_hand: number } | null)?.quantity_on_hand ?? 0;
      const newQuantity = currentQuantity + data.quantity;

      // Update stock
      await supabase
        .from('inventory_stock')
        .upsert({
          inventory_item_id: item.id,
          garage_id: garageId,
          quantity_on_hand: newQuantity,
          updated_at: new Date().toISOString(),
        });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error restocking:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="item-name" className="block text-sm font-medium text-gray-700">
          Item
        </label>
        <input
          type="text"
          id="item-name"
          value={`${item.name} (${item.sku})`}
          disabled
          className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
        />
      </div>

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
          Quantity to Add
        </label>
        <input
          {...register('quantity', { valueAsNumber: true })}
          type="number"
          min="1"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location (optional)
        </label>
        <input
          {...register('location')}
          type="text"
          placeholder="e.g., Aisle 3, Shelf B"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Restocking...' : 'Restock'}
        </button>
      </div>
    </form>
  );
}

