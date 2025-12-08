-- Transitland Fleet OS - Demo Scenario Seed Data
-- This script creates the full demo scenario:
-- - 2 garages (North: 175 buses, South: 125 buses)
-- - 300 buses with realistic data
-- - Inventory items and stock
-- - Work orders showing maintenance backlog (20-30 buses in maintenance)

-- ============================================================================
-- STEP 1: CREATE GARAGES
-- ============================================================================

-- North Garage (175 buses)
INSERT INTO garages (id, name, total_bays, timezone, address)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'North Garage', 20, 'America/New_York', '4500 North Transit Way, Metro City, ST 12345')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  total_bays = EXCLUDED.total_bays,
  address = EXCLUDED.address;

-- South Garage (125 buses)
INSERT INTO garages (id, name, total_bays, timezone, address)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'South Garage', 15, 'America/New_York', '2800 South Maintenance Blvd, Metro City, ST 12346')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  total_bays = EXCLUDED.total_bays,
  address = EXCLUDED.address;

-- ============================================================================
-- STEP 2: CREATE 300 BUSES
-- ============================================================================
-- North Garage: 175 buses (buses 001-175)
-- South Garage: 125 buses (buses 176-300)

DO $$
DECLARE
  north_garage_id UUID := '11111111-1111-1111-1111-111111111111';
  south_garage_id UUID := '22222222-2222-2222-2222-222222222222';
  bus_num INTEGER;
  vin_prefix VARCHAR(3);
  make_model TEXT[];
  selected_make_model TEXT[];
  make_name VARCHAR(100);
  model_name VARCHAR(100);
  year_val INTEGER;
  odometer_val INTEGER;
  status_val VARCHAR(50);
  last_service DATE;
  next_service_miles INTEGER;
  next_service_date DATE;
BEGIN
  -- Common bus makes/models
  make_model := ARRAY[
    'Gillig|Advantage|40',
    'Gillig|Low Floor|35',
    'New Flyer|Xcelsior|40',
    'New Flyer|MiDi|30',
    'Proterra|Catalyst|40',
    'Nova Bus|LFS|40',
    'BYD|K9M|40',
    'ElDorado|Aero Elite|35'
  ];

  -- Create 175 buses for North Garage
  FOR bus_num IN 1..175 LOOP
    -- Generate realistic VIN (simplified pattern)
    vin_prefix := 'TRN'; -- Transitland prefix
    
    -- Select random make/model
    selected_make_model := string_to_array(make_model[1 + floor(random() * array_length(make_model, 1))::int], '|');
    make_name := selected_make_model[1];
    model_name := selected_make_model[2];
    year_val := 2015 + floor(random() * 10)::int; -- 2015-2024
    odometer_val := 50000 + floor(random() * 200000)::int; -- 50k-250k miles
    
    -- Determine status based on bus number (to create realistic distribution)
    -- Buses 1-25: IN_MAINTENANCE (maintenance backlog)
    -- Buses 26-50: MAINTENANCE_DUE (overdue for service)
    -- Buses 51-150: IN_SERVICE (active)
    -- Buses 151-170: AVAILABLE (ready to deploy)
    -- Buses 171-175: OUT_OF_SERVICE (major issues)
    
    IF bus_num <= 25 THEN
      status_val := 'IN_MAINTENANCE';
      last_service := CURRENT_DATE - INTERVAL '45 days' - (INTERVAL '1 day' * (random() * 30)::int);
      next_service_miles := odometer_val + 5000 - (random() * 10000)::int;
      next_service_date := NULL;
    ELSIF bus_num <= 50 THEN
      status_val := 'MAINTENANCE_DUE';
      last_service := CURRENT_DATE - INTERVAL '90 days' - (INTERVAL '1 day' * (random() * 30)::int);
      next_service_miles := odometer_val - (random() * 5000)::int;
      next_service_date := CURRENT_DATE - INTERVAL '10 days' - (INTERVAL '1 day' * (random() * 20)::int);
    ELSIF bus_num <= 150 THEN
      status_val := 'IN_SERVICE';
      last_service := CURRENT_DATE - INTERVAL '30 days' + (INTERVAL '1 day' * (random() * 60)::int);
      next_service_miles := odometer_val + 3000 + (random() * 5000)::int;
      next_service_date := CURRENT_DATE + INTERVAL '30 days' + (INTERVAL '1 day' * (random() * 30)::int);
    ELSIF bus_num <= 170 THEN
      status_val := 'AVAILABLE';
      last_service := CURRENT_DATE - INTERVAL '10 days' + (INTERVAL '1 day' * (random() * 20)::int);
      next_service_miles := odometer_val + 5000 + (random() * 5000)::int;
      next_service_date := CURRENT_DATE + INTERVAL '60 days' + (INTERVAL '1 day' * (random() * 30)::int);
    ELSE
      status_val := 'OUT_OF_SERVICE';
      last_service := CURRENT_DATE - INTERVAL '120 days' - (INTERVAL '1 day' * (random() * 60)::int);
      next_service_miles := NULL;
      next_service_date := NULL;
    END IF;
    
    INSERT INTO vehicles (
      vin, status, garage_id, make, model, year, odometer,
      last_service_date, next_service_miles, next_service_date,
      winterized_bool
    ) VALUES (
      vin_prefix || LPAD(bus_num::TEXT, 6, '0') || LPAD((year_val % 100)::TEXT, 2, '0') || LPAD((random() * 9999)::int::TEXT, 4, '0'),
      status_val,
      north_garage_id,
      make_name,
      model_name,
      year_val,
      odometer_val,
      last_service,
      next_service_miles,
      next_service_date,
      CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) IN (11, 12, 1, 2, 3) THEN TRUE ELSE FALSE END
    );
  END LOOP;

  -- Create 125 buses for South Garage
  FOR bus_num IN 176..300 LOOP
    -- Generate realistic VIN
    vin_prefix := 'TRS'; -- Transitland South prefix
    
    -- Select random make/model
    selected_make_model := string_to_array(make_model[1 + floor(random() * array_length(make_model, 1))::int], '|');
    make_name := selected_make_model[1];
    model_name := selected_make_model[2];
    year_val := 2015 + floor(random() * 10)::int;
    odometer_val := 50000 + floor(random() * 200000)::int;
    
    -- Determine status
    -- Buses 176-190: IN_MAINTENANCE
    -- Buses 191-210: MAINTENANCE_DUE
    -- Buses 211-280: IN_SERVICE
    -- Buses 281-290: AVAILABLE
    -- Buses 291-300: OUT_OF_SERVICE
    
    IF bus_num <= 190 THEN
      status_val := 'IN_MAINTENANCE';
      last_service := CURRENT_DATE - INTERVAL '45 days' - (INTERVAL '1 day' * (random() * 30)::int);
      next_service_miles := odometer_val + 5000 - (random() * 10000)::int;
      next_service_date := NULL;
    ELSIF bus_num <= 210 THEN
      status_val := 'MAINTENANCE_DUE';
      last_service := CURRENT_DATE - INTERVAL '90 days' - (INTERVAL '1 day' * (random() * 30)::int);
      next_service_miles := odometer_val - (random() * 5000)::int;
      next_service_date := CURRENT_DATE - INTERVAL '10 days' - (INTERVAL '1 day' * (random() * 20)::int);
    ELSIF bus_num <= 280 THEN
      status_val := 'IN_SERVICE';
      last_service := CURRENT_DATE - INTERVAL '30 days' + (INTERVAL '1 day' * (random() * 60)::int);
      next_service_miles := odometer_val + 3000 + (random() * 5000)::int;
      next_service_date := CURRENT_DATE + INTERVAL '30 days' + (INTERVAL '1 day' * (random() * 30)::int);
    ELSIF bus_num <= 290 THEN
      status_val := 'AVAILABLE';
      last_service := CURRENT_DATE - INTERVAL '10 days' + (INTERVAL '1 day' * (random() * 20)::int);
      next_service_miles := odometer_val + 5000 + (random() * 5000)::int;
      next_service_date := CURRENT_DATE + INTERVAL '60 days' + (INTERVAL '1 day' * (random() * 30)::int);
    ELSE
      status_val := 'OUT_OF_SERVICE';
      last_service := CURRENT_DATE - INTERVAL '120 days' - (INTERVAL '1 day' * (random() * 60)::int);
      next_service_miles := NULL;
      next_service_date := NULL;
    END IF;
    
    INSERT INTO vehicles (
      vin, status, garage_id, make, model, year, odometer,
      last_service_date, next_service_miles, next_service_date,
      winterized_bool
    ) VALUES (
      vin_prefix || LPAD((bus_num - 175)::TEXT, 6, '0') || LPAD((year_val % 100)::TEXT, 2, '0') || LPAD((random() * 9999)::int::TEXT, 4, '0'),
      status_val,
      south_garage_id,
      make_name,
      model_name,
      year_val,
      odometer_val,
      last_service,
      next_service_miles,
      next_service_date,
      CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) IN (11, 12, 1, 2, 3) THEN TRUE ELSE FALSE END
    );
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: CREATE INVENTORY ITEMS (Common Bus Parts)
-- ============================================================================

INSERT INTO inventory_items (id, sku, name, category, min_threshold, unit, supplier, cost) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BRK-PAD-FRONT', 'Brake Pads - Front', 'Regular', 20, 'set', 'Brake Systems Inc', 125.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BRK-PAD-REAR', 'Brake Pads - Rear', 'Regular', 20, 'set', 'Brake Systems Inc', 95.00),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'OIL-FILTER-10W30', 'Oil Filter - 10W30', 'Regular', 50, 'each', 'Fleet Parts Co', 12.50),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ENG-OIL-10W30', 'Engine Oil - 10W30 (5gal)', 'Regular', 30, 'gallon', 'Fleet Parts Co', 45.00),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'TIRE-12R22.5', 'Tire - 12R22.5 All Position', 'Regular', 40, 'each', 'Tire Distributors', 350.00),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'BATTERY-12V-200AH', 'Battery - 12V 200AH', 'Regular', 15, 'each', 'Power Systems', 280.00),
  ('11111111-1111-1111-1111-111111111111', 'AIR-FILTER', 'Air Filter - Heavy Duty', 'Regular', 25, 'each', 'Fleet Parts Co', 35.00),
  ('22222222-2222-2222-2222-222222222222', 'FUEL-FILTER', 'Fuel Filter', 'Regular', 30, 'each', 'Fleet Parts Co', 28.00),
  ('33333333-3333-3333-3333-333333333333', 'BELT-SERPENTINE', 'Serpentine Belt', 'Regular', 20, 'each', 'Fleet Parts Co', 45.00),
  ('44444444-4444-4444-4444-444444444444', 'RADIATOR-HOSE', 'Radiator Hose - Upper', 'Regular', 15, 'each', 'Cooling Systems', 55.00),
  ('55555555-5555-5555-5555-555555555555', 'ANTIFREEZE-GAL', 'Antifreeze - Gallon', 'Seasonal', 40, 'gallon', 'Cooling Systems', 18.00),
  ('66666666-6666-6666-6666-666666666666', 'WINDSHIELD-WIPER', 'Windshield Wiper Blade', 'Regular', 30, 'each', 'Auto Glass Co', 25.00),
  ('77777777-7777-7777-7777-777777777777', 'HEADLIGHT-BULB', 'Headlight Bulb - H4', 'Regular', 25, 'each', 'Lighting Solutions', 15.00),
  ('88888888-8888-8888-8888-888888888888', 'SPARK-PLUG', 'Spark Plug - Iridium', 'Regular', 50, 'each', 'Ignition Parts', 8.50),
  ('99999999-9999-9999-9999-999999999999', 'TRANSMISSION-FLUID', 'Transmission Fluid (5gal)', 'Regular', 20, 'gallon', 'Fleet Parts Co', 38.00),
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'HYDRAULIC-FLUID', 'Hydraulic Fluid - Brake', 'Regular', 25, 'gallon', 'Brake Systems Inc', 42.00),
  ('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'WHEEL-BEARING', 'Wheel Bearing Kit', 'Regular', 12, 'kit', 'Suspension Parts', 185.00),
  ('cccccccc-dddd-eeee-ffff-111111111111', 'SHOCK-ABSORBER', 'Shock Absorber - Rear', 'Regular', 10, 'each', 'Suspension Parts', 220.00),
  ('dddddddd-eeee-ffff-1111-222222222222', 'EXHAUST-MUFFLER', 'Exhaust Muffler', 'Regular', 8, 'each', 'Exhaust Systems', 450.00),
  ('eeeeeeee-ffff-1111-2222-333333333333', 'ALTERNATOR-REBUILD', 'Alternator Rebuild Kit', 'Regular', 5, 'kit', 'Electrical Systems', 320.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  min_threshold = EXCLUDED.min_threshold,
  supplier = EXCLUDED.supplier,
  cost = EXCLUDED.cost;

-- ============================================================================
-- STEP 4: CREATE INVENTORY STOCK FOR BOTH GARAGES
-- ============================================================================
-- Some items will be low/out of stock to show the problem

DO $$
DECLARE
  north_garage_id UUID := '11111111-1111-1111-1111-111111111111';
  south_garage_id UUID := '22222222-2222-2222-2222-222222222222';
  item_record RECORD;
  north_qty INTEGER;
  south_qty INTEGER;
BEGIN
  FOR item_record IN SELECT id, sku, min_threshold FROM inventory_items LOOP
    -- North Garage stock (some items low/out)
    IF item_record.sku IN ('BRK-PAD-FRONT', 'TIRE-12R22.5', 'BATTERY-12V-200AH') THEN
      -- Critical items that are low/out
      north_qty := floor(random() * 5)::int; -- 0-4 (below threshold)
    ELSIF item_record.sku IN ('OIL-FILTER-10W30', 'AIR-FILTER') THEN
      -- Items at threshold
      north_qty := item_record.min_threshold + floor(random() * 5)::int;
    ELSE
      -- Normal stock levels
      north_qty := item_record.min_threshold + 20 + floor(random() * 30)::int;
    END IF;
    
    -- South Garage stock
    IF item_record.sku IN ('BRK-PAD-REAR', 'ANTIFREEZE-GAL', 'HYDRAULIC-FLUID') THEN
      -- Low stock items
      south_qty := floor(random() * 8)::int;
    ELSE
      -- Normal stock
      south_qty := item_record.min_threshold + 15 + floor(random() * 25)::int;
    END IF;
    
    INSERT INTO inventory_stock (inventory_item_id, garage_id, quantity_on_hand, location, last_restocked_at)
    VALUES 
      (item_record.id, north_garage_id, north_qty, 'Aisle ' || (floor(random() * 10) + 1)::text || '-Shelf ' || (floor(random() * 5) + 1)::text, CURRENT_DATE - INTERVAL '7 days' - (INTERVAL '1 day' * (random() * 14)::int)),
      (item_record.id, south_garage_id, south_qty, 'Bay ' || (floor(random() * 8) + 1)::text || '-Bin ' || (floor(random() * 4) + 1)::text, CURRENT_DATE - INTERVAL '7 days' - (INTERVAL '1 day' * (random() * 14)::int))
    ON CONFLICT (inventory_item_id, garage_id) DO UPDATE SET
      quantity_on_hand = EXCLUDED.quantity_on_hand,
      location = EXCLUDED.location;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 5: CREATE WORK ORDERS (Maintenance Backlog)
-- ============================================================================
-- Create work orders for vehicles in maintenance and maintenance due
-- Assign some to mechanics, leave some unassigned

DO $$
DECLARE
  north_garage_id UUID := '11111111-1111-1111-1111-111111111111';
  south_garage_id UUID := '22222222-2222-2222-2222-222222222222';
  vehicle_record RECORD;
  mechanic_ids UUID[];
  selected_mechanic_id UUID;
  work_order_id UUID;
  issue_types TEXT[] := ARRAY['Brake System', 'Engine', 'Transmission', 'Electrical', 'Suspension', 'HVAC', 'Body Damage', 'Tire Replacement'];
  titles TEXT[] := ARRAY[
    'Brake pad replacement - front',
    'Engine oil change and filter',
    'Transmission fluid service',
    'Battery replacement',
    'Tire replacement - all positions',
    'Air filter replacement',
    'Suspension repair',
    'Electrical system diagnosis',
    'HVAC system service',
    'Radiator leak repair',
    'Exhaust system repair',
    'Wheel bearing replacement',
    'Headlight replacement',
    'Windshield wiper motor repair'
  ];
  selected_issue VARCHAR(100);
  selected_title VARCHAR(255);
  priority_val VARCHAR(2);
  status_val VARCHAR(50);
  estimated_hours_val DECIMAL(5,2);
  mechanic_user_id UUID;
BEGIN
  -- Get mechanic IDs from North Garage
  SELECT ARRAY_AGG(m.id) INTO mechanic_ids
  FROM mechanics m
  JOIN users u ON m.user_id = u.id
  WHERE u.garage_id = north_garage_id;
  
  -- Create work orders for North Garage vehicles in maintenance/maintenance due
  FOR vehicle_record IN 
    SELECT v.id, v.vin, v.status, v.garage_id
    FROM vehicles v
    WHERE v.garage_id = north_garage_id 
      AND v.status IN ('IN_MAINTENANCE', 'MAINTENANCE_DUE')
    LIMIT 30
  LOOP
    -- Select random issue and title
    selected_issue := issue_types[1 + floor(random() * array_length(issue_types, 1))::int];
    selected_title := titles[1 + floor(random() * array_length(titles, 1))::int];
    
    -- Determine priority based on status
    IF vehicle_record.status = 'IN_MAINTENANCE' THEN
      priority_val := CASE 
        WHEN random() < 0.3 THEN 'P0'  -- 30% critical
        WHEN random() < 0.6 THEN 'P1'  -- 30% high
        ELSE 'P2'                      -- 40% medium
      END;
      status_val := CASE
        WHEN random() < 0.4 THEN 'In Progress'  -- 40% in progress
        WHEN random() < 0.7 THEN 'Waiting'     -- 30% waiting for parts
        ELSE 'Open'                              -- 30% open
      END;
    ELSE
      priority_val := CASE
        WHEN random() < 0.2 THEN 'P1'  -- 20% high
        WHEN random() < 0.5 THEN 'P2' -- 30% medium
        ELSE 'P3'                      -- 50% low
      END;
      status_val := 'Open';
    END IF;
    
    estimated_hours_val := 2.0 + (random() * 8.0); -- 2-10 hours
    
    -- Assign to mechanic 60% of the time
    selected_mechanic_id := NULL;
    IF array_length(mechanic_ids, 1) > 0 AND random() < 0.6 THEN
      selected_mechanic_id := mechanic_ids[1 + floor(random() * array_length(mechanic_ids, 1))::int];
    END IF;
    
    -- Get a user ID for created_by (use mechanic user if assigned, otherwise ops manager)
    IF selected_mechanic_id IS NOT NULL THEN
      SELECT user_id INTO mechanic_user_id FROM mechanics WHERE id = selected_mechanic_id;
    ELSE
      SELECT id INTO mechanic_user_id FROM users WHERE garage_id = north_garage_id AND role = 'ops_manager' LIMIT 1;
    END IF;
    
    INSERT INTO work_orders (
      vehicle_id, assigned_mechanic_id, priority, status, type, title, 
      description, issue_type, estimated_hours, created_by
    ) VALUES (
      vehicle_record.id,
      selected_mechanic_id,
      priority_val,
      status_val,
      CASE WHEN random() < 0.3 THEN 'Preventive' ELSE 'Repair' END,
      selected_title,
      'Vehicle reported issue: ' || selected_issue || '. Requires inspection and repair.',
      selected_issue,
      estimated_hours_val,
      mechanic_user_id
    );
  END LOOP;
  
  -- Get mechanic IDs from South Garage
  SELECT ARRAY_AGG(m.id) INTO mechanic_ids
  FROM mechanics m
  JOIN users u ON m.user_id = u.id
  WHERE u.garage_id = south_garage_id;
  
  -- Create work orders for South Garage vehicles
  FOR vehicle_record IN 
    SELECT v.id, v.vin, v.status, v.garage_id
    FROM vehicles v
    WHERE v.garage_id = south_garage_id 
      AND v.status IN ('IN_MAINTENANCE', 'MAINTENANCE_DUE')
    LIMIT 25
  LOOP
    selected_issue := issue_types[1 + floor(random() * array_length(issue_types, 1))::int];
    selected_title := titles[1 + floor(random() * array_length(titles, 1))::int];
    
    IF vehicle_record.status = 'IN_MAINTENANCE' THEN
      priority_val := CASE 
        WHEN random() < 0.3 THEN 'P0'
        WHEN random() < 0.6 THEN 'P1'
        ELSE 'P2'
      END;
      status_val := CASE
        WHEN random() < 0.4 THEN 'In Progress'
        WHEN random() < 0.7 THEN 'Waiting'
        ELSE 'Open'
      END;
    ELSE
      priority_val := CASE
        WHEN random() < 0.2 THEN 'P1'
        WHEN random() < 0.5 THEN 'P2'
        ELSE 'P3'
      END;
      status_val := 'Open';
    END IF;
    
    estimated_hours_val := 2.0 + (random() * 8.0);
    
    selected_mechanic_id := NULL;
    IF array_length(mechanic_ids, 1) > 0 AND random() < 0.6 THEN
      selected_mechanic_id := mechanic_ids[1 + floor(random() * array_length(mechanic_ids, 1))::int];
    END IF;
    
    IF selected_mechanic_id IS NOT NULL THEN
      SELECT user_id INTO mechanic_user_id FROM mechanics WHERE id = selected_mechanic_id;
    ELSE
      SELECT id INTO mechanic_user_id FROM users WHERE garage_id = south_garage_id AND role = 'ops_manager' LIMIT 1;
    END IF;
    
    INSERT INTO work_orders (
      vehicle_id, assigned_mechanic_id, priority, status, type, title, 
      description, issue_type, estimated_hours, created_by
    ) VALUES (
      vehicle_record.id,
      selected_mechanic_id,
      priority_val,
      status_val,
      CASE WHEN random() < 0.3 THEN 'Preventive' ELSE 'Repair' END,
      selected_title,
      'Vehicle reported issue: ' || selected_issue || '. Requires inspection and repair.',
      selected_issue,
      estimated_hours_val,
      mechanic_user_id
    );
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Uncomment to verify the setup:

-- Garage summary
-- SELECT g.name, COUNT(v.id) as total_buses,
--   COUNT(CASE WHEN v.status = 'IN_MAINTENANCE' THEN 1 END) as in_maintenance,
--   COUNT(CASE WHEN v.status = 'MAINTENANCE_DUE' THEN 1 END) as maintenance_due,
--   COUNT(CASE WHEN v.status = 'IN_SERVICE' THEN 1 END) as in_service,
--   COUNT(CASE WHEN v.status = 'AVAILABLE' THEN 1 END) as available,
--   COUNT(CASE WHEN v.status = 'OUT_OF_SERVICE' THEN 1 END) as out_of_service
-- FROM garages g
-- LEFT JOIN vehicles v ON g.id = v.garage_id
-- GROUP BY g.id, g.name
-- ORDER BY g.name;

-- Work orders summary
-- SELECT g.name, 
--   COUNT(wo.id) as total_work_orders,
--   COUNT(CASE WHEN wo.status = 'Open' THEN 1 END) as open,
--   COUNT(CASE WHEN wo.status = 'In Progress' THEN 1 END) as in_progress,
--   COUNT(CASE WHEN wo.status = 'Waiting' THEN 1 END) as waiting,
--   COUNT(CASE WHEN wo.priority = 'P0' THEN 1 END) as p0_critical,
--   COUNT(CASE WHEN wo.priority = 'P1' THEN 1 END) as p1_high
-- FROM garages g
-- JOIN vehicles v ON g.id = v.garage_id
-- JOIN work_orders wo ON v.id = wo.vehicle_id
-- GROUP BY g.id, g.name
-- ORDER BY g.name;

-- Low stock items
-- SELECT g.name, ii.sku, ii.name, is.quantity_on_hand, ii.min_threshold,
--   CASE WHEN is.quantity_on_hand < ii.min_threshold THEN 'LOW STOCK' ELSE 'OK' END as status
-- FROM garages g
-- JOIN inventory_stock is ON g.id = is.garage_id
-- JOIN inventory_items ii ON is.inventory_item_id = ii.id
-- WHERE is.quantity_on_hand < ii.min_threshold
-- ORDER BY g.name, is.quantity_on_hand ASC;

