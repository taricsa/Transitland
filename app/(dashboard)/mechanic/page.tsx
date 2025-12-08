'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useWorkOrders } from '@/lib/hooks/useWorkOrders';
import { WorkOrderCard } from '@/components/features/work-orders/WorkOrderCard';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { SyncStatus } from '@/components/ui/SyncStatus';
import { PlusIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { handleLogout } from '@/lib/utils/logout';

export default function MechanicDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [mechanicId, setMechanicId] = useState<string | undefined>();
  const { workOrders, loading } = useWorkOrders(mechanicId);

  useEffect(() => {
    async function getMechanicId() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: mechanicData } = await supabase
          .from('mechanics')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (mechanicData) {
          setMechanicId(mechanicData.id);
        }
      }
    }
    getMechanicId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openWorkOrders = workOrders.filter(
    (wo) => wo.status !== 'Closed' && wo.status !== 'Cancelled'
  );
  const closedWorkOrders = workOrders.filter(
    (wo) => wo.status === 'Closed' || wo.status === 'Cancelled'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Work Orders</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your assigned work orders
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SyncStatus />
            <button
              onClick={() => router.push('/mechanic/work-orders/new')}
              className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="h-5 w-5" />
              New Work Order
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading work orders...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {openWorkOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Open Work Orders ({openWorkOrders.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  {openWorkOrders.map((wo) => (
                    <WorkOrderCard
                      key={wo.id}
                      workOrder={wo}
                      onClick={() => router.push(`/mechanic/work-orders/${wo.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {closedWorkOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Closed Work Orders ({closedWorkOrders.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  {closedWorkOrders.map((wo) => (
                    <WorkOrderCard
                      key={wo.id}
                      workOrder={wo}
                      onClick={() => router.push(`/mechanic/work-orders/${wo.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {workOrders.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">No work orders assigned</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

