import { VehicleStatus } from '@/types';

export type VehicleStateTransition = {
  from: VehicleStatus;
  to: VehicleStatus;
  condition?: (vehicle: any) => boolean;
};

// Valid state transitions
const VALID_TRANSITIONS: VehicleStateTransition[] = [
  { from: VehicleStatus.AVAILABLE, to: VehicleStatus.IN_SERVICE },
  { from: VehicleStatus.AVAILABLE, to: VehicleStatus.MAINTENANCE_DUE },
  { from: VehicleStatus.AVAILABLE, to: VehicleStatus.IN_MAINTENANCE },
  { from: VehicleStatus.AVAILABLE, to: VehicleStatus.OUT_OF_SERVICE },
  { from: VehicleStatus.IN_SERVICE, to: VehicleStatus.AVAILABLE },
  { from: VehicleStatus.IN_SERVICE, to: VehicleStatus.MAINTENANCE_DUE },
  { from: VehicleStatus.IN_SERVICE, to: VehicleStatus.OUT_OF_SERVICE },
  { from: VehicleStatus.MAINTENANCE_DUE, to: VehicleStatus.IN_MAINTENANCE },
  { from: VehicleStatus.MAINTENANCE_DUE, to: VehicleStatus.OUT_OF_SERVICE },
  { from: VehicleStatus.IN_MAINTENANCE, to: VehicleStatus.AVAILABLE },
  { from: VehicleStatus.IN_MAINTENANCE, to: VehicleStatus.OUT_OF_SERVICE },
  { from: VehicleStatus.OUT_OF_SERVICE, to: VehicleStatus.IN_MAINTENANCE },
  { from: VehicleStatus.OUT_OF_SERVICE, to: VehicleStatus.AVAILABLE },
];

export function canTransition(
  from: VehicleStatus,
  to: VehicleStatus,
  vehicle?: any
): boolean {
  const transition = VALID_TRANSITIONS.find(
    (t) => t.from === from && t.to === to
  );

  if (!transition) {
    return false;
  }

  // Check additional conditions if any
  if (transition.condition) {
    return transition.condition(vehicle);
  }

  return true;
}

export function getValidNextStates(
  currentStatus: VehicleStatus,
  vehicle?: any
): VehicleStatus[] {
  return VALID_TRANSITIONS
    .filter((t) => t.from === currentStatus)
    .filter((t) => !t.condition || t.condition(vehicle))
    .map((t) => t.to);
}

export function getStatusColor(status: VehicleStatus): string {
  const colorMap: Record<VehicleStatus, string> = {
    [VehicleStatus.AVAILABLE]: 'green',
    [VehicleStatus.IN_SERVICE]: 'blue',
    [VehicleStatus.MAINTENANCE_DUE]: 'yellow',
    [VehicleStatus.IN_MAINTENANCE]: 'orange',
    [VehicleStatus.OUT_OF_SERVICE]: 'red',
  };
  return colorMap[status] || 'gray';
}

export function getStatusLabel(status: VehicleStatus): string {
  const labelMap: Record<VehicleStatus, string> = {
    [VehicleStatus.AVAILABLE]: 'Available',
    [VehicleStatus.IN_SERVICE]: 'In Service',
    [VehicleStatus.MAINTENANCE_DUE]: 'Maintenance Due',
    [VehicleStatus.IN_MAINTENANCE]: 'In Maintenance',
    [VehicleStatus.OUT_OF_SERVICE]: 'Out of Service',
  };
  return labelMap[status] || status;
}

