# Demo Data Setup Guide

This guide explains how to set up the full demo scenario with 300 buses, 2 garages, inventory, and work orders.

## Demo Scenario Overview

The demo simulates Transitland's real-world situation:
- **300 buses** split between 2 garages:
  - **North Garage**: 175 buses
  - **South Garage**: 125 buses
- **20-30 buses in maintenance** at any given time
- **Maintenance backlog** with various priority work orders
- **Inventory stock** with some items low/out of stock
- **Realistic vehicle data** (VINs, makes, models, odometer readings, service dates)

## Setup Steps

### 1. Run the Demo Data Seed Script

Execute `007_seed_demo_data.sql` in the Supabase SQL Editor:

```sql
-- This creates:
-- - North Garage (175 buses)
-- - South Garage (125 buses)
-- - 300 buses with realistic data
-- - 20 inventory items
-- - Inventory stock for both garages (some low/out of stock)
-- - 50-55 work orders showing maintenance backlog
```

### 2. Assign Test Users to Demo Garages

Execute `008_assign_users_to_demo_garages.sql` to reassign your test users to North Garage:

```sql
-- This updates test users to be assigned to North Garage
-- so they can see and interact with the demo data
```

## What Gets Created

### Garages
- **North Garage**: 20 maintenance bays, 175 buses
- **South Garage**: 15 maintenance bays, 125 buses

### Vehicles (300 total)
- **North Garage (175 buses)**:
  - 25 buses: `IN_MAINTENANCE` (maintenance backlog)
  - 25 buses: `MAINTENANCE_DUE` (overdue for service)
  - 100 buses: `IN_SERVICE` (active)
  - 20 buses: `AVAILABLE` (ready to deploy)
  - 5 buses: `OUT_OF_SERVICE` (major issues)

- **South Garage (125 buses)**:
  - 15 buses: `IN_MAINTENANCE`
  - 20 buses: `MAINTENANCE_DUE`
  - 70 buses: `IN_SERVICE`
  - 10 buses: `AVAILABLE`
  - 10 buses: `OUT_OF_SERVICE`

### Inventory Items (20 items)
Common bus parts including:
- Brake pads (front/rear)
- Oil filters and engine oil
- Tires (12R22.5)
- Batteries
- Air filters
- Transmission fluid
- Antifreeze (seasonal)
- Various other maintenance parts

**Stock Levels:**
- Some items are **low/out of stock** to demonstrate the inventory problem
- North Garage: Brake pads, tires, and batteries are low
- South Garage: Brake pads, antifreeze, and hydraulic fluid are low

### Work Orders (50-55 total)
- Created for vehicles in `IN_MAINTENANCE` and `MAINTENANCE_DUE` status
- Mix of priorities: P0 (critical), P1 (high), P2 (medium), P3 (low)
- Mix of statuses: Open, In Progress, Waiting (for parts)
- Some assigned to mechanics, some unassigned
- Mix of Preventive and Repair types

## Verification Queries

After running the scripts, you can verify the setup with these queries:

### Garage Summary
```sql
SELECT g.name, COUNT(v.id) as total_buses,
  COUNT(CASE WHEN v.status = 'IN_MAINTENANCE' THEN 1 END) as in_maintenance,
  COUNT(CASE WHEN v.status = 'MAINTENANCE_DUE' THEN 1 END) as maintenance_due,
  COUNT(CASE WHEN v.status = 'IN_SERVICE' THEN 1 END) as in_service,
  COUNT(CASE WHEN v.status = 'AVAILABLE' THEN 1 END) as available,
  COUNT(CASE WHEN v.status = 'OUT_OF_SERVICE' THEN 1 END) as out_of_service
FROM garages g
LEFT JOIN vehicles v ON g.id = v.garage_id
GROUP BY g.id, g.name
ORDER BY g.name;
```

### Work Orders Summary
```sql
SELECT g.name, 
  COUNT(wo.id) as total_work_orders,
  COUNT(CASE WHEN wo.status = 'Open' THEN 1 END) as open,
  COUNT(CASE WHEN wo.status = 'In Progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN wo.status = 'Waiting' THEN 1 END) as waiting,
  COUNT(CASE WHEN wo.priority = 'P0' THEN 1 END) as p0_critical,
  COUNT(CASE WHEN wo.priority = 'P1' THEN 1 END) as p1_high
FROM garages g
JOIN vehicles v ON g.id = v.garage_id
JOIN work_orders wo ON v.id = wo.vehicle_id
GROUP BY g.id, g.name
ORDER BY g.name;
```

### Low Stock Items
```sql
SELECT g.name, ii.sku, ii.name, is.quantity_on_hand, ii.min_threshold,
  CASE WHEN is.quantity_on_hand < ii.min_threshold THEN 'LOW STOCK' ELSE 'OK' END as status
FROM garages g
JOIN inventory_stock is ON g.id = is.garage_id
JOIN inventory_items ii ON is.inventory_item_id = ii.id
WHERE is.quantity_on_hand < ii.min_threshold
ORDER BY g.name, is.quantity_on_hand ASC;
```

## Demo Scenarios to Showcase

### 1. Maintenance Backlog
- Log in as **Ops Manager** to see the dashboard showing:
  - 40 buses in maintenance across both garages
  - 50+ open work orders
  - Priority breakdown (P0, P1, P2, P3)

### 2. Parts Shortage
- Log in as **Parts Clerk** to see:
  - Low stock alerts for critical items
  - Items below minimum threshold
  - Need to restock brake pads, tires, batteries

### 3. Mechanic Workload
- Log in as **Mechanic** to see:
  - Assigned work orders
  - Priority work orders waiting
  - Vehicles stuck waiting for parts

### 4. Vehicle Status
- View vehicles by status:
  - IN_MAINTENANCE: Buses currently being repaired
  - MAINTENANCE_DUE: Buses overdue for service
  - IN_SERVICE: Active buses on routes
  - AVAILABLE: Ready to deploy
  - OUT_OF_SERVICE: Major issues requiring extensive repair

## Notes

- Vehicle VINs follow a pattern: `TRN` (North) or `TRS` (South) prefix
- Vehicle makes/models are randomized from common transit bus manufacturers
- Odometer readings range from 50k to 250k miles
- Service dates are calculated relative to current date
- Work orders are randomly assigned to mechanics (if available) or left unassigned
- Some work orders are marked as "Waiting" to simulate parts shortage delays

