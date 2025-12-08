import { VehicleStatus } from '@/types';
import { getStatusColor, getStatusLabel } from '@/lib/utils/vehicleStateMachine';
import { cn } from '@/lib/utils/cn';

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

export function VehicleStatusBadge({ status, className }: VehicleStatusBadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colorClasses[color],
        className
      )}
    >
      {label}
    </span>
  );
}

