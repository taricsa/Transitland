'use client';

import { InventoryStock, InventoryItem } from '@/types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface LowStockAlertsProps {
  lowStockItems: (InventoryStock & { item: InventoryItem })[];
  criticalItems: (InventoryStock & { item: InventoryItem })[];
}

export function LowStockAlerts({ lowStockItems, criticalItems }: LowStockAlertsProps) {
  if (lowStockItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {criticalItems.length > 0 && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Critical Stockout ({criticalItems.length})
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc space-y-1 pl-5">
                  {criticalItems.map((item) => (
                    <li key={item.id}>
                      {item.item.name} ({item.item.sku}) - Out of stock
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {lowStockItems.filter((item) => item.quantity_on_hand > 0).length > 0 && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Low Stock Alerts ({lowStockItems.filter((item) => item.quantity_on_hand > 0).length})
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc space-y-1 pl-5">
                  {lowStockItems
                    .filter((item) => item.quantity_on_hand > 0)
                    .map((item) => (
                      <li key={item.id}>
                        {item.item.name} ({item.item.sku}) - {item.quantity_on_hand} remaining
                        (threshold: {item.item.min_threshold})
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

