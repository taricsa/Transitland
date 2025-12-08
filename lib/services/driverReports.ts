import { createClient } from '@/lib/supabase/client';
import { WorkOrderPriority, WorkOrderType, WorkOrderStatus } from '@/types';
import { WorkOrderPriorityService } from './workOrderPriority';
import { isCriticalIssue } from '@/lib/utils/priorityMatrix';

export interface DriverIssueReport {
  vehicle_id: string;
  issue_type: string;
  description: string;
  is_critical: boolean;
}

export class DriverReportService {
  private supabase = createClient();

  /**
   * Create a work order from driver report
   * Auto-creates P0 work order for critical failures
   */
  async createWorkOrderFromReport(report: DriverIssueReport, driverId: string) {
    const isCritical = isCriticalIssue(report.issue_type) || report.is_critical;
    const priority = isCritical
      ? WorkOrderPriority.P0
      : WorkOrderPriorityService.autoAssignPriority(report.issue_type);

    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    // Create work order
    const { data: workOrder, error: woError } = await this.supabase
      .from('work_orders')
      .insert({
        vehicle_id: report.vehicle_id,
        title: `${report.issue_type} - Driver Report`,
        description: report.description,
        issue_type: report.issue_type,
        type: WorkOrderType.REPAIR,
        priority,
        status: WorkOrderStatus.OPEN,
        created_by: user?.id || undefined,
      })
      .select()
      .single();

    if (woError) throw woError;

    // Alert ops manager if critical
    if (WorkOrderPriorityService.shouldAlertOpsManager(priority)) {
      await this.alertOpsManager(workOrder.id, report);
    }

    return workOrder;
  }

  /**
   * Alert operations manager about critical issue
   */
  private async alertOpsManager(workOrderId: string, report: DriverIssueReport) {
    // In a real implementation, this would:
    // 1. Send notification to ops managers
    // 2. Create alert in dashboard
    // 3. Send email/SMS if configured
    
    // For now, we'll create a work_order_event to track this
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    await this.supabase.from('work_order_events').insert({
      work_order_id: workOrderId,
      event_type: 'Status Change',
      user_id: user?.id,
      description: `Critical issue reported by driver - Ops Manager alerted`,
      metadata: {
        alert_type: 'critical_driver_report',
        issue_type: report.issue_type,
      },
    });
  }

  /**
   * Get driver's current vehicle
   */
  async getDriverVehicle(driverId: string) {
    const { data, error } = await this.supabase
      .from('drivers')
      .select('current_vehicle_id')
      .eq('id', driverId)
      .single();

    if (error) throw error;
    return data?.current_vehicle_id;
  }
}

export const driverReportService = new DriverReportService();

