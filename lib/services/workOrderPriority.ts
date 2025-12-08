import { WorkOrderPriority } from '@/types';
import { getPriorityForIssueTypeWithSeason } from '@/lib/utils/priorityMatrix';

export class WorkOrderPriorityService {
  /**
   * Auto-assign priority based on issue type and current date
   */
  static autoAssignPriority(issueType: string | null | undefined): WorkOrderPriority {
    return getPriorityForIssueTypeWithSeason(issueType);
  }

  /**
   * Check if issue requires immediate attention (P0)
   */
  static isCritical(issueType: string | null | undefined): boolean {
    return this.autoAssignPriority(issueType) === WorkOrderPriority.P0;
  }

  /**
   * Get target resolution time based on priority
   */
  static getTargetResolutionTime(priority: WorkOrderPriority): string {
    const targets: Record<WorkOrderPriority, string> = {
      [WorkOrderPriority.P0]: 'Same-day',
      [WorkOrderPriority.P1]: '24 hours',
      [WorkOrderPriority.P2]: '3-5 days',
      [WorkOrderPriority.P3]: 'Next scheduled service',
    };
    return targets[priority];
  }

  /**
   * Check if work order should alert ops manager
   */
  static shouldAlertOpsManager(priority: WorkOrderPriority): boolean {
    return priority === WorkOrderPriority.P0 || priority === WorkOrderPriority.P1;
  }
}

