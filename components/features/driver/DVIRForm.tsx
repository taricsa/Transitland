'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { driverReportService } from '@/lib/services/driverReports';
import { useRouter } from 'next/navigation';

const dvirSchema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  brakes: z.enum(['pass', 'fail', 'na']),
  steering: z.enum(['pass', 'fail', 'na']),
  tires: z.enum(['pass', 'fail', 'na']),
  lights: z.enum(['pass', 'fail', 'na']),
  wheelchair_lift: z.enum(['pass', 'fail', 'na']),
  mirrors: z.enum(['pass', 'fail', 'na']),
  horn: z.enum(['pass', 'fail', 'na']),
  wipers: z.enum(['pass', 'fail', 'na']),
  notes: z.string().optional(),
});

type DVIRFormData = z.infer<typeof dvirSchema>;

interface DVIRFormProps {
  vehicleId?: string;
  onSuccess?: () => void;
}

export function DVIRForm({ vehicleId, onSuccess }: DVIRFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<DVIRFormData>({
    resolver: zodResolver(dvirSchema),
    defaultValues: {
      vehicle_id: vehicleId || '',
      brakes: 'na',
      steering: 'na',
      tires: 'na',
      lights: 'na',
      wheelchair_lift: 'na',
      mirrors: 'na',
      horn: 'na',
      wipers: 'na',
    },
  });

  useState(() => {
    async function getDriverId() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();
        if (userData) {
          const typedUserData = userData as { id: string };
          const { data: driverData } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', typedUserData.id)
            .single();
          if (driverData) {
            const typedDriverData = driverData as { id: string };
            setDriverId(typedDriverData.id);
          }
        }
      }
    }
    getDriverId();
  });

  const watchedValues = watch();
  const hasFailures = Object.values(watchedValues).some(
    (value) => value === 'fail'
  );

  const onSubmit = async (data: DVIRFormData) => {
    if (!driverId) return;

    try {
      setLoading(true);

      // Check for critical failures
      const criticalFailures = ['brakes', 'steering', 'wheelchair_lift'].filter(
        (key) => data[key as keyof DVIRFormData] === 'fail'
      );

      if (criticalFailures.length > 0) {
        // Auto-create P0 work order for critical failures
        for (const failure of criticalFailures) {
          await driverReportService.createWorkOrderFromReport(
            {
              vehicle_id: data.vehicle_id,
              issue_type: failure.charAt(0).toUpperCase() + failure.slice(1).replace('_', ' '),
              description: `DVIR failure: ${failure}. ${data.notes || ''}`,
              is_critical: true,
            },
            driverId
          );
        }
      } else if (hasFailures) {
        // Create regular work order for non-critical failures
        const failures = Object.entries(data)
          .filter(([_, value]) => value === 'fail')
          .map(([key, _]) => key);

        await driverReportService.createWorkOrderFromReport(
          {
            vehicle_id: data.vehicle_id,
            issue_type: failures.join(', '),
            description: `DVIR failures: ${failures.join(', ')}. ${data.notes || ''}`,
            is_critical: false,
          },
          driverId
        );
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/driver');
      }
    } catch (err) {
      console.error('Error submitting DVIR:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { key: 'brakes', label: 'Brakes', critical: true },
          { key: 'steering', label: 'Steering', critical: true },
          { key: 'tires', label: 'Tires', critical: false },
          { key: 'lights', label: 'Lights', critical: false },
          { key: 'wheelchair_lift', label: 'Wheelchair Lift', critical: true },
          { key: 'mirrors', label: 'Mirrors', critical: false },
          { key: 'horn', label: 'Horn', critical: false },
          { key: 'wipers', label: 'Wipers', critical: false },
        ].map((item) => (
          <div key={item.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {item.label}
              {item.critical && <span className="text-red-600 ml-1">*</span>}
            </label>
            <select
              {...register(item.key as keyof DVIRFormData)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="na">N/A</option>
            </select>
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Additional Notes
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          placeholder="Any additional observations..."
        />
      </div>

      {hasFailures && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Failures detected. A work order will be created automatically.
            {Object.values(watchedValues).some((v) => v === 'fail') &&
              ' Critical failures will create a P0 work order and alert operations manager.'}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit DVIR'}
        </button>
      </div>
    </form>
  );
}

