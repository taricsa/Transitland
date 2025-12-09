'use client';

import { InventoryStock, InventoryItem, InventoryCategory } from '@/types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface InventoryGridProps {
  inventory: (InventoryStock & { item: InventoryItem })[];
  onRestock?: (itemId: string) => void;
}

export function InventoryGrid({ inventory, onRestock }: InventoryGridProps) {
  const isLowStock = (item: InventoryStock & { item: InventoryItem }) => {
    return item.quantity_on_hand <= item.item.min_threshold;
  };

  const isCritical = (item: InventoryStock & { item: InventoryItem }) => {
    return item.quantity_on_hand === 0;
  };

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              SKU
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Name
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Category
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Quantity
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Threshold
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Location
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {inventory.map((item) => {
            const lowStock = isLowStock(item);
            const critical = isCritical(item);
            
            return (
              <tr
                key={item.id}
                className={critical ? 'bg-red-50' : lowStock ? 'bg-yellow-50' : ''}
              >
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {item.item.sku}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  {item.item.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.item.category === InventoryCategory.SEASONAL
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.item.category}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    {critical && <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />}
                    {lowStock && !critical && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />}
                    <span className={critical ? 'font-bold text-red-600' : lowStock ? 'font-semibold text-yellow-600' : ''}>
                      {item.quantity_on_hand}
                    </span>
                    <span className="text-gray-500">/ {item.reserved_quantity} reserved</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {item.item.min_threshold}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {item.location || 'N/A'}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  {onRestock && (
                    <button
                      onClick={() => onRestock(item.inventory_item_id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Restock
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

