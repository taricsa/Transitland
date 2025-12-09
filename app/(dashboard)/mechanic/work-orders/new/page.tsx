'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { WorkOrderForm } from '@/components/features/work-orders/WorkOrderForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

function WorkOrderFormWrapper() {
  return <WorkOrderForm />;
}

export default function NewWorkOrderPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-lg bg-white shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Work Order</h1>
          <Suspense fallback={<div className="text-gray-500">Loading form...</div>}>
            <WorkOrderFormWrapper />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

