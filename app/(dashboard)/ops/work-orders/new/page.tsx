'use client';

export const dynamic = 'force-dynamic';

import { WorkOrderForm } from '@/components/features/work-orders/WorkOrderForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function NewWorkOrderPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-lg bg-white shadow-sm p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Create New Work Order</h1>
          <WorkOrderForm />
        </div>
      </div>
    </div>
  );
}

