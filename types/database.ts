// This file will be auto-generated from Supabase schema
// For now, we'll define a basic structure that matches our migrations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      garages: {
        Row: {
          id: string;
          name: string;
          total_bays: number;
          timezone: string;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          total_bays?: number;
          timezone?: string;
          address?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          total_bays?: number;
          timezone?: string;
          address?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          auth_id: string;
          role: 'mechanic' | 'ops_manager' | 'parts_clerk' | 'driver';
          garage_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          auth_id: string;
          role: 'mechanic' | 'ops_manager' | 'parts_clerk' | 'driver';
          garage_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
        };
        Update: {
          id?: string;
          auth_id?: string;
          role?: 'mechanic' | 'ops_manager' | 'parts_clerk' | 'driver';
          garage_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
        };
      };
      vehicles: {
        Row: {
          id: string;
          vin: string;
          status: 'AVAILABLE' | 'IN_SERVICE' | 'MAINTENANCE_DUE' | 'IN_MAINTENANCE' | 'OUT_OF_SERVICE';
          garage_id: string;
          current_driver_id: string | null;
          current_tire_set_id: string | null;
          winterized_bool: boolean;
          make: string | null;
          model: string | null;
          year: number | null;
          odometer: number;
          last_service_date: string | null;
          next_service_miles: number | null;
          next_service_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vin: string;
          status?: 'AVAILABLE' | 'IN_SERVICE' | 'MAINTENANCE_DUE' | 'IN_MAINTENANCE' | 'OUT_OF_SERVICE';
          garage_id: string;
          current_driver_id?: string | null;
          current_tire_set_id?: string | null;
          winterized_bool?: boolean;
          make?: string | null;
          model?: string | null;
          year?: number | null;
          odometer?: number;
          last_service_date?: string | null;
          next_service_miles?: number | null;
          next_service_date?: string | null;
        };
        Update: {
          id?: string;
          vin?: string;
          status?: 'AVAILABLE' | 'IN_SERVICE' | 'MAINTENANCE_DUE' | 'IN_MAINTENANCE' | 'OUT_OF_SERVICE';
          garage_id?: string;
          current_driver_id?: string | null;
          current_tire_set_id?: string | null;
          winterized_bool?: boolean;
          make?: string | null;
          model?: string | null;
          year?: number | null;
          odometer?: number;
          last_service_date?: string | null;
          next_service_miles?: number | null;
          next_service_date?: string | null;
        };
      };
      work_orders: {
        Row: {
          id: string;
          vehicle_id: string;
          assigned_mechanic_id: string | null;
          priority: 'P0' | 'P1' | 'P2' | 'P3';
          status: 'Open' | 'Waiting' | 'In Progress' | 'Closed' | 'Cancelled';
          type: 'Preventive' | 'Repair';
          title: string;
          description: string | null;
          issue_type: string | null;
          estimated_hours: number | null;
          actual_hours: number | null;
          cost: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          assigned_mechanic_id?: string | null;
          priority?: 'P0' | 'P1' | 'P2' | 'P3';
          status?: 'Open' | 'Waiting' | 'In Progress' | 'Closed' | 'Cancelled';
          type: 'Preventive' | 'Repair';
          title: string;
          description?: string | null;
          issue_type?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          cost?: number | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          assigned_mechanic_id?: string | null;
          priority?: 'P0' | 'P1' | 'P2' | 'P3';
          status?: 'Open' | 'Waiting' | 'In Progress' | 'Closed' | 'Cancelled';
          type?: 'Preventive' | 'Repair';
          title?: string;
          description?: string | null;
          issue_type?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          cost?: number | null;
          created_by?: string | null;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          sku: string;
          name: string;
          category: 'Seasonal' | 'Regular';
          min_threshold: number;
          unit: string;
          supplier: string | null;
          cost: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          category: 'Seasonal' | 'Regular';
          min_threshold?: number;
          unit?: string;
          supplier?: string | null;
          cost?: number | null;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          category?: 'Seasonal' | 'Regular';
          min_threshold?: number;
          unit?: string;
          supplier?: string | null;
          cost?: number | null;
        };
      };
      inventory_stock: {
        Row: {
          id: string;
          inventory_item_id: string;
          garage_id: string;
          quantity_on_hand: number;
          reserved_quantity: number;
          location: string | null;
          last_restocked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          garage_id: string;
          quantity_on_hand?: number;
          reserved_quantity?: number;
          location?: string | null;
          last_restocked_at?: string | null;
        };
        Update: {
          id?: string;
          inventory_item_id?: string;
          garage_id?: string;
          quantity_on_hand?: number;
          reserved_quantity?: number;
          location?: string | null;
          last_restocked_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

