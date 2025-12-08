import { Vehicle } from '@/types';
import { VehicleStatusBadge } from './VehicleStatusBadge';
import { TruckIcon } from '@heroicons/react/24/outline';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
  showDetails?: boolean;
}

export function VehicleCard({ vehicle, onClick, showDetails = true }: VehicleCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
            <TruckIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
            </h3>
            <p className="text-sm text-gray-500">VIN: {vehicle.vin}</p>
            {showDetails && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  Odometer: {vehicle.odometer.toLocaleString()} miles
                </p>
                {vehicle.winterized_bool && (
                  <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Winterized
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <VehicleStatusBadge status={vehicle.status} />
      </div>
    </div>
  );
}

