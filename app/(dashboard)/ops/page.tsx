'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeDashboard } from '@/lib/hooks/useRealtimeDashboard';
import { KPICards } from '@/components/features/dashboard/KPICards';
import { FleetStatusMap } from '@/components/features/dashboard/FleetStatusMap';
import { MechanicRoster } from '@/components/features/dashboard/MechanicRoster';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { SyncStatus } from '@/components/ui/SyncStatus';

export default function OpsDashboard() {
  const supabase = createClient();
  const [garageId, setGarageId] = useState<string | undefined>();
  const [garages, setGarages] = useState<{ id: string; name: string; address?: string }[]>([]);
  const { vehicles, workOrders, mechanics, metrics, loading } = useRealtimeDashboard(garageId);

  useEffect(() => {
    async function getGarageId() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('garage_id')
          .eq('id', user.id)
          .single();
        if (userData) {
          const typedUserData = userData as { garage_id?: string | null };
          if (typedUserData.garage_id) {
            setGarageId(typedUserData.garage_id);
          }
        }
      }

      // Load all garages for the map
      const { data: garagesData } = await supabase
        .from('garages')
        .select('id, name, address');
      if (garagesData) {
        setGarages(garagesData);
      }
    }
    getGarageId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Control Tower</h1>
            <p className="mt-2 text-sm text-gray-600">
              Real-time fleet operations dashboard
            </p>
          </div>
          <SyncStatus />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <KPICards metrics={metrics} />
            <FleetStatusMap vehicles={vehicles} garages={garages} />
            <MechanicRoster mechanics={mechanics} workOrders={workOrders} />
          </div>
        )}
      </div>
    </div>
  );
}

