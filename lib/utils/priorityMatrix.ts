import { WorkOrderPriority } from '@/types';

export interface IssueType {
  type: string;
  priority: WorkOrderPriority;
  description?: string;
}

// Priority matrix mapping issue types to priorities
const PRIORITY_MATRIX: IssueType[] = [
  // P0: Critical safety/compliance issues
  { type: 'Brakes', priority: WorkOrderPriority.P0, description: 'Critical safety issue' },
  { type: 'Wheelchair Lift', priority: WorkOrderPriority.P0, description: 'ADA compliance issue' },
  { type: 'Steering', priority: WorkOrderPriority.P0, description: 'Critical safety issue' },
  { type: 'Tires - Critical', priority: WorkOrderPriority.P0, description: 'Critical safety issue' },
  
  // P1: Service impacting issues
  { type: 'A/C', priority: WorkOrderPriority.P1, description: 'Service impacting in summer' },
  { type: 'Heater', priority: WorkOrderPriority.P1, description: 'Service impacting in winter' },
  { type: 'Engine', priority: WorkOrderPriority.P1, description: 'Service impacting' },
  { type: 'Transmission', priority: WorkOrderPriority.P1, description: 'Service impacting' },
  
  // P2: Performance/Efficiency issues
  { type: 'Minor Leak', priority: WorkOrderPriority.P2, description: 'Performance issue' },
  { type: 'Electrical - Minor', priority: WorkOrderPriority.P2, description: 'Performance issue' },
  { type: 'Body - Minor', priority: WorkOrderPriority.P2, description: 'Performance issue' },
  
  // P3: Cosmetic/Deferrable (default)
  { type: 'Cosmetic', priority: WorkOrderPriority.P3, description: 'Deferrable' },
  { type: 'Torn Seat', priority: WorkOrderPriority.P3, description: 'Deferrable' },
  { type: 'Dent', priority: WorkOrderPriority.P3, description: 'Deferrable' },
];

export function getPriorityForIssueType(issueType: string | null | undefined): WorkOrderPriority {
  if (!issueType) return WorkOrderPriority.P3;

  const match = PRIORITY_MATRIX.find(
    (item) => item.type.toLowerCase() === issueType.toLowerCase()
  );

  return match?.priority || WorkOrderPriority.P3;
}

export function getPriorityForIssueTypeWithSeason(
  issueType: string | null | undefined,
  currentMonth?: number
): WorkOrderPriority {
  const basePriority = getPriorityForIssueType(issueType);
  
  // Adjust for seasonality
  if (!currentMonth) {
    currentMonth = new Date().getMonth() + 1; // 1-12
  }

  // A/C is more critical in summer (June-August)
  if (issueType?.toLowerCase() === 'a/c' && currentMonth >= 6 && currentMonth <= 8) {
    return WorkOrderPriority.P0;
  }

  // Heater is more critical in winter (November-March)
  if (issueType?.toLowerCase() === 'heater' && (currentMonth >= 11 || currentMonth <= 3)) {
    return WorkOrderPriority.P0;
  }

  return basePriority;
}

export function isCriticalIssue(issueType: string | null | undefined): boolean {
  return getPriorityForIssueType(issueType) === WorkOrderPriority.P0;
}

export function getIssueTypes(): IssueType[] {
  return PRIORITY_MATRIX;
}

export function getPriorityDescription(priority: WorkOrderPriority): string {
  const descriptions: Record<WorkOrderPriority, string> = {
    [WorkOrderPriority.P0]: 'Critical: Safety/Compliance issue - Same-day fix required',
    [WorkOrderPriority.P1]: 'High: Service impacting - 24h fix target',
    [WorkOrderPriority.P2]: 'Medium: Performance/Efficiency - 3-5 days target',
    [WorkOrderPriority.P3]: 'Deferrable: Cosmetic - Next scheduled service',
  };
  return descriptions[priority];
}

