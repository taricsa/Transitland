'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useInventory } from '@/lib/hooks/useInventory';
import { InventoryGrid } from '@/components/features/inventory/InventoryGrid';
import { LowStockAlerts } from '@/components/features/inventory/LowStockAlerts';
import { RestockForm } from '@/components/features/inventory/RestockForm';
import { InventoryItem } from '@/types';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { handleLogout } from '@/lib/utils/logout';

export default function PartsClerkDashboard() {
  const supabase = createClient();
  const [garageId, setGarageId] = useState<string | undefined>();
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const { inventory, loading, getLowStockItems, getCriticalStockItems, restock } = useInventory(garageId);

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
    }
    getGarageId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lowStockItems = getLowStockItems();
  const criticalItems = getCriticalStockItems();

  const handleRestock = async (itemId: string) => {
    const item = inventory.find((inv) => inv.inventory_item_id === itemId)?.item;
    if (item) {
      setRestockItem(item);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track and manage parts inventory
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Sign Out
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading inventory...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <LowStockAlerts
              lowStockItems={lowStockItems}
              criticalItems={criticalItems}
            />

            <div className="rounded-lg bg-white shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">All Inventory</h2>
              <InventoryGrid inventory={inventory} onRestock={handleRestock} />
            </div>
          </div>
        )}

        {/* Restock Modal */}
        <Dialog
          open={!!restockItem}
          onClose={() => setRestockItem(null)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold">Restock Item</Dialog.Title>
                <button
                  onClick={() => setRestockItem(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              {restockItem && garageId && (
                <RestockForm
                  item={restockItem}
                  garageId={garageId}
                  onSuccess={() => setRestockItem(null)}
                  onCancel={() => setRestockItem(null)}
                />
              )}
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

