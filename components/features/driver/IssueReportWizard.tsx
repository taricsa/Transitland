'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { driverReportService } from '@/lib/services/driverReports';
import { useRouter } from 'next/navigation';

const issueReportSchema = z.object({
  issue_type: z.string().min(1, 'Issue type is required'),
  description: z.string().min(1, 'Description is required'),
  is_critical: z.boolean().default(false),
});

type IssueReportFormData = z.infer<typeof issueReportSchema>;

interface IssueReportWizardProps {
  vehicleId: string;
  onSuccess?: () => void;
}

const ISSUE_TYPES = [
  'Brakes',
  'Steering',
  'Tires',
  'Engine',
  'Transmission',
  'A/C',
  'Heater',
  'Electrical',
  'Wheelchair Lift',
  'Body Damage',
  'Other',
];

export function IssueReportWizard({ vehicleId, onSuccess }: IssueReportWizardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<IssueReportFormData>({
    resolver: zodResolver(issueReportSchema),
    defaultValues: {
      is_critical: false,
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

  const issueType = watch('issue_type');
  const isCritical = watch('is_critical');

  const onSubmit = async (data: IssueReportFormData) => {
    if (!driverId) return;

    try {
      setLoading(true);
      await driverReportService.createWorkOrderFromReport(
        {
          vehicle_id: vehicleId,
          issue_type: data.issue_type,
          description: data.description,
          is_critical: data.is_critical,
        },
        driverId
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/driver');
      }
    } catch (err) {
      console.error('Error reporting issue:', err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">What&apos;s the issue?</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ISSUE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                // Set issue type and move to next step
                const form = document.querySelector('form');
                if (form) {
                  const input = form.querySelector('[name="issue_type"]') as HTMLInputElement;
                  if (input) input.value = type;
                }
                setStep(2);
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {type}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('issue_type')} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Issue Type
        </label>
        <input
          type="text"
          value={issueType || ''}
          disabled
          className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
        />
        <button
          type="button"
          onClick={() => setStep(1)}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-900"
        >
          Change
        </button>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          placeholder="Describe the issue..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          {...register('is_critical')}
          type="checkbox"
          id="is_critical"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="is_critical" className="ml-2 block text-sm text-gray-900">
          This is a critical safety issue
        </label>
      </div>

      {isCritical && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Critical issues will create a P0 work order and immediately alert the operations manager.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Report Issue'}
        </button>
      </div>
    </form>
  );
}

