import { createClient } from '@/lib/supabase/client';
import { Vehicle, VehicleStatus } from '@/types';
import { canTransition } from '@/lib/utils/vehicleStateMachine';

export class VehicleService {
  private supabase = createClient();

  async getVehicleById(id: string): Promise<Vehicle | null> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Vehicle | null;
  }

  async getVehicleByVIN(vin: string): Promise<Vehicle | null> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .eq('vin', vin)
      .single();

    if (error) throw error;
    return data as Vehicle | null;
  }

  async getVehiclesByGarage(garageId: string): Promise<Vehicle[]> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .eq('garage_id', garageId)
      .order('status', { ascending: true });

    if (error) throw error;
    return (data || []) as Vehicle[];
  }

  async getVehiclesByStatus(status: VehicleStatus): Promise<Vehicle[]> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .eq('status', status);

    if (error) throw error;
    return (data || []) as Vehicle[];
  }

  async updateVehicleStatus(
    vehicleId: string,
    newStatus: VehicleStatus,
    currentStatus?: VehicleStatus
  ): Promise<Vehicle> {
    // Get current status if not provided
    if (!currentStatus) {
      const vehicle = await this.getVehicleById(vehicleId);
      if (!vehicle) throw new Error('Vehicle not found');
      currentStatus = vehicle.status;
    }

    // Validate transition
    if (!canTransition(currentStatus, newStatus)) {
      throw new Error(
        `Invalid state transition from ${currentStatus} to ${newStatus}`
      );
    }

    const { data, error } = await this.supabase
      .from('vehicles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) throw error;
    return data as Vehicle;
  }

  async assignDriver(vehicleId: string, driverId: string): Promise<Vehicle> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .update({
        current_driver_id: driverId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) throw error;
    return data as Vehicle;
  }

  async updateOdometer(vehicleId: string, odometer: number): Promise<Vehicle> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .update({
        odometer,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) throw error;
    return data as Vehicle;
  }

  async markWinterized(vehicleId: string): Promise<Vehicle> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .update({
        winterized_bool: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) throw error;
    return data as Vehicle;
  }

  async searchVehicles(query: string): Promise<Vehicle[]> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .or(`vin.ilike.%${query}%,make.ilike.%${query}%,model.ilike.%${query}%`);

    if (error) throw error;
    return (data || []) as Vehicle[];
  }
}

export const vehicleService = new VehicleService();

