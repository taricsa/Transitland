'use client';

import { Vehicle } from '@/types';
import { VehicleStatus } from '@/types';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface FleetStatusMapProps {
  vehicles: Vehicle[];
  garages?: { id: string; name: string; address?: string }[];
}

export function FleetStatusMap({ vehicles, garages }: FleetStatusMapProps) {
  // Group vehicles by garage
  const vehiclesByGarage = vehicles.reduce((acc, vehicle) => {
    if (!acc[vehicle.garage_id]) {
      acc[vehicle.garage_id] = [];
    }
    acc[vehicle.garage_id].push(vehicle);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  const getStatusCounts = (garageVehicles: Vehicle[]) => {
    return {
      available: garageVehicles.filter((v) => v.status === VehicleStatus.AVAILABLE).length,
      inService: garageVehicles.filter((v) => v.status === VehicleStatus.IN_SERVICE).length,
      inMaintenance: garageVehicles.filter((v) => v.status === VehicleStatus.IN_MAINTENANCE).length,
      outOfService: garageVehicles.filter((v) => v.status === VehicleStatus.OUT_OF_SERVICE).length,
      total: garageVehicles.length,
    };
  };

  const getGarageStatus = (counts: ReturnType<typeof getStatusCounts>) => {
    if (counts.outOfService > 0) return 'critical';
    if (counts.inMaintenance > counts.total * 0.2) return 'warning';
    return 'good';
  };

  return (
    <div className="rounded-lg bg-white shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Fleet Status by Garage</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(vehiclesByGarage).map(([garageId, garageVehicles]) => {
          const counts = getStatusCounts(garageVehicles);
          const status = getGarageStatus(counts);
          const garage = garages?.find((g) => g.id === garageId);

          return (
            <div
              key={garageId}
              className={`rounded-lg border-2 p-4 ${
                status === 'critical'
                  ? 'border-red-300 bg-red-50'
                  : status === 'warning'
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-green-300 bg-green-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPinIcon className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">
                  {garage?.name || `Garage ${garageId.slice(0, 8)}`}
                </h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{counts.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Available:</span>
                  <span className="font-medium">{counts.available}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">In Service:</span>
                  <span className="font-medium">{counts.inService}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-600">In Maintenance:</span>
                  <span className="font-medium">{counts.inMaintenance}</span>
                </div>
                {counts.outOfService > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-600">Out of Service:</span>
                    <span className="font-medium text-red-600">{counts.outOfService}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

