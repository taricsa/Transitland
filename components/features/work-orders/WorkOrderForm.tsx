'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WorkOrderType, WorkOrderPriority, WorkOrderStatus } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useWorkOrders } from '@/lib/hooks/useWorkOrders';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

const workOrderSchema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  issue_type: z.string().optional(),
  type: z.nativeEnum(WorkOrderType),
  priority: z.nativeEnum(WorkOrderPriority),
  estimated_hours: z.number().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

interface WorkOrderFormProps {
  vehicleId?: string;
  onSuccess?: () => void;
}

export function WorkOrderForm({ vehicleId, onSuccess }: WorkOrderFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { createWorkOrder } = useWorkOrders();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Get vehicleId and type from props or URL params
  // searchParams is guaranteed to be available when wrapped in Suspense
  const urlVehicleId = searchParams.get('vehicleId') || vehicleId || '';
  const urlType = searchParams.get('type') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      type: (urlType === 'Preventive' ? WorkOrderType.PREVENTIVE : WorkOrderType.REPAIR),
      priority: WorkOrderPriority.P3,
      vehicle_id: urlVehicleId,
    },
  });

  // Load vehicles
  useEffect(() => {
    async function loadVehicles() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('garage_id, role')
          .eq('id', user.id)
          .single();
        if (userData) {
          const typedUserData = userData as { garage_id?: string | null; role?: string };
          
          // If ops manager, show all vehicles; otherwise show only garage vehicles
          if (typedUserData.role === 'ops_manager') {
            const { data: vehiclesData } = await supabase
              .from('vehicles')
              .select('id, vin, make, model, year')
              .order('vin');
            if (vehiclesData) {
              setVehicles(vehiclesData);
            }
          } else if (typedUserData.garage_id) {
            const { data: vehiclesData } = await supabase
              .from('vehicles')
              .select('id, vin, make, model, year')
              .eq('garage_id', typedUserData.garage_id);
            if (vehiclesData) {
              setVehicles(vehiclesData);
            }
          }
        }
      }
    }
    loadVehicles();
  }, [supabase]);

  // Set vehicle and type from URL params
  useEffect(() => {
    if (urlVehicleId) {
      setValue('vehicle_id', urlVehicleId);
    }
    if (urlType === 'Preventive') {
      setValue('type', WorkOrderType.PREVENTIVE);
    }
  }, [urlVehicleId, urlType, setValue]);

  const onSubmit = async (data: WorkOrderFormData) => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const workOrder = await createWorkOrder({
        ...data,
        status: WorkOrderStatus.OPEN,
        created_by: user?.id || undefined,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect based on user role - check if we're in ops route
        const currentPath = window.location.pathname;
        if (currentPath.includes('/ops/')) {
          router.push(`/ops`);
        } else {
          router.push(`/mechanic/work-orders/${workOrder.id}`);
        }
      }
    } catch (err) {
      console.error('Error creating work order:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700">
          Vehicle
        </label>
        <select
          {...register('vehicle_id')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select a vehicle</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.make} {vehicle.model} {vehicle.year} - {vehicle.vin}
            </option>
          ))}
        </select>
        {errors.vehicle_id && (
          <p className="mt-1 text-sm text-red-600">{errors.vehicle_id.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          {...register('title')}
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          {...register('type')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value={WorkOrderType.REPAIR}>Repair</option>
          <option value={WorkOrderType.PREVENTIVE}>Preventive</option>
        </select>
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
          Priority
        </label>
        <select
          {...register('priority')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value={WorkOrderPriority.P0}>P0 - Critical</option>
          <option value={WorkOrderPriority.P1}>P1 - High</option>
          <option value={WorkOrderPriority.P2}>P2 - Medium</option>
          <option value={WorkOrderPriority.P3}>P3 - Deferrable</option>
        </select>
      </div>

      <div>
        <label htmlFor="issue_type" className="block text-sm font-medium text-gray-700">
          Issue Type (optional)
        </label>
        <input
          {...register('issue_type')}
          type="text"
          placeholder="e.g., Brakes, A/C, Engine"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700">
          Estimated Hours (optional)
        </label>
        <input
          {...register('estimated_hours', { valueAsNumber: true })}
          type="number"
          step="0.5"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Work Order'}
        </button>
      </div>
    </form>
  );
}

