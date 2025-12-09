// Transitland Fleet OS - TypeScript Type Definitions

// Enums
export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_SERVICE = 'IN_SERVICE',
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum WorkOrderPriority {
  P0 = 'P0', // Critical
  P1 = 'P1', // High
  P2 = 'P2', // Medium
  P3 = 'P3', // Deferrable
}

export enum WorkOrderStatus {
  OPEN = 'Open',
  WAITING = 'Waiting',
  IN_PROGRESS = 'In Progress',
  CLOSED = 'Closed',
  CANCELLED = 'Cancelled',
}

export enum WorkOrderType {
  PREVENTIVE = 'Preventive',
  REPAIR = 'Repair',
}

export enum UserRole {
  MECHANIC = 'mechanic',
  OPS_MANAGER = 'ops_manager',
  PARTS_CLERK = 'parts_clerk',
  DRIVER = 'driver',
}

export enum InventoryCategory {
  SEASONAL = 'Seasonal',
  REGULAR = 'Regular',
}

// Database Types
export interface Garage {
  id: string;
  name: string;
  total_bays: number;
  timezone: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  role: UserRole;
  garage_id?: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Mechanic {
  id: string;
  user_id: string;
  specialty?: string;
  shift_pattern?: string;
  certification_level?: string;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  license_expiry?: string;
  current_vehicle_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  vin: string;
  status: VehicleStatus;
  garage_id: string;
  current_driver_id?: string;
  current_tire_set_id?: string;
  winterized_bool: boolean;
  make?: string;
  model?: string;
  year?: number;
  odometer: number;
  last_service_date?: string;
  next_service_miles?: number;
  next_service_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  vehicle_id: string;
  assigned_mechanic_id?: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  type: WorkOrderType;
  title: string;
  description?: string;
  issue_type?: string;
  estimated_hours?: number;
  actual_hours?: number;
  cost?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface WorkOrderEvent {
  id: string;
  work_order_id: string;
  event_type: 'Status Change' | 'Part Used' | 'Note Added' | 'Photo Added' | 'Assigned' | 'Unassigned';
  timestamp: string;
  user_id?: string;
  metadata?: Record<string, any>;
  description?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  min_threshold: number;
  unit: string;
  supplier?: string;
  cost?: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryStock {
  id: string;
  inventory_item_id: string;
  garage_id: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  location?: string;
  last_restocked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderPart {
  id: string;
  work_order_id: string;
  inventory_item_id: string;
  quantity: number;
  garage_id: string;
  created_at: string;
}

// Analytics Types
export interface DailyGarageStats {
  id: string;
  date: string;
  garage_id: string;
  total_vehicles: number;
  vehicles_down: number;
  vehicles_available: number;
  vehicles_in_service: number;
  vehicles_in_maintenance: number;
  availability_rate: number;
  created_at: string;
}

export interface MechanicDailyLog {
  id: string;
  date: string;
  mechanic_id: string;
  hours_logged: number;
  tickets_closed: number;
  wrench_efficiency_score: number;
  created_at: string;
}

export interface DriverRiskScore {
  id: string;
  month: string;
  driver_id: string;
  miles_driven: number;
  avoidable_repair_count: number;
  cost_per_mile: number;
  risk_score: number;
  created_at: string;
  updated_at: string;
}

export interface StockoutEvent {
  id: string;
  work_order_id?: string;
  part_id: string;
  garage_id: string;
  hours_delayed: number;
  resolved_at?: string;
  created_at: string;
}

export interface SeasonalCampaign {
  id: string;
  campaign_name: string;
  start_date: string;
  end_date: string;
  target_vehicles_count: number;
  completed_vehicles_count: number;
  garage_id?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

