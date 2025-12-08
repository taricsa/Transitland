-- Transitland Fleet OS - Business Logic Functions & Triggers

-- Function: Auto-assign priority based on issue type
CREATE OR REPLACE FUNCTION assign_work_order_priority()
RETURNS TRIGGER AS $$
BEGIN
    -- P0: Critical safety/compliance issues
    IF NEW.issue_type IN ('Brakes', 'Wheelchair Lift', 'Steering', 'Tires - Critical') THEN
        NEW.priority := 'P0';
    -- P1: Service impacting issues
    ELSIF NEW.issue_type IN ('A/C', 'Heater', 'Engine', 'Transmission') THEN
        NEW.priority := 'P1';
    -- P2: Performance/Efficiency issues
    ELSIF NEW.issue_type IN ('Minor Leak', 'Electrical - Minor', 'Body - Minor') THEN
        NEW.priority := 'P2';
    -- P3: Cosmetic/Deferrable (default)
    ELSE
        NEW.priority := 'P3';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-assign priority on work order creation
CREATE TRIGGER auto_assign_priority
    BEFORE INSERT ON work_orders
    FOR EACH ROW
    WHEN (NEW.priority = 'P3' OR NEW.priority IS NULL)
    EXECUTE FUNCTION assign_work_order_priority();

-- Function: Update vehicle status based on work order
CREATE OR REPLACE FUNCTION update_vehicle_status_from_wo()
RETURNS TRIGGER AS $$
BEGIN
    -- When work order is created, set vehicle to IN_MAINTENANCE
    IF TG_OP = 'INSERT' AND NEW.status = 'Open' THEN
        UPDATE vehicles
        SET status = 'IN_MAINTENANCE'
        WHERE id = NEW.vehicle_id;
        
        -- Log the event
        INSERT INTO work_order_events (work_order_id, event_type, user_id, description)
        VALUES (NEW.id, 'Status Change', NEW.created_by, 'Work order created - Vehicle set to IN_MAINTENANCE');
    END IF;
    
    -- When work order is closed, check if vehicle should be AVAILABLE
    IF TG_OP = 'UPDATE' AND NEW.status = 'Closed' AND OLD.status != 'Closed' THEN
        -- Check if there are any other open work orders for this vehicle
        IF NOT EXISTS (
            SELECT 1 FROM work_orders
            WHERE vehicle_id = NEW.vehicle_id
            AND status NOT IN ('Closed', 'Cancelled')
            AND id != NEW.id
        ) THEN
            UPDATE vehicles
            SET status = 'AVAILABLE'
            WHERE id = NEW.vehicle_id;
            
            -- Log the event
            INSERT INTO work_order_events (work_order_id, event_type, user_id, description)
            VALUES (NEW.id, 'Status Change', NEW.assigned_mechanic_id, 'Work order closed - Vehicle set to AVAILABLE');
        END IF;
        
        -- Update closed_at timestamp
        NEW.closed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update vehicle status on work order changes
CREATE TRIGGER update_vehicle_status_trigger
    AFTER INSERT OR UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_status_from_wo();

-- Function: Auto-decrement inventory when part is used in work order
CREATE OR REPLACE FUNCTION decrement_inventory_on_part_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrement quantity_on_hand when part is added to work order
    IF TG_OP = 'INSERT' THEN
        UPDATE inventory_stock
        SET quantity_on_hand = quantity_on_hand - NEW.quantity,
            reserved_quantity = reserved_quantity + NEW.quantity
        WHERE inventory_item_id = NEW.inventory_item_id
        AND garage_id = NEW.garage_id;
        
        -- Check for stockout
        IF EXISTS (
            SELECT 1 FROM inventory_stock
            WHERE inventory_item_id = NEW.inventory_item_id
            AND garage_id = NEW.garage_id
            AND quantity_on_hand <= 0
        ) THEN
            -- Create stockout event
            INSERT INTO stockout_events (work_order_id, part_id, garage_id, created_at)
            VALUES (NEW.work_order_id, NEW.inventory_item_id, NEW.garage_id, NOW());
        END IF;
        
        -- Log the event
        INSERT INTO work_order_events (work_order_id, event_type, metadata)
        VALUES (NEW.work_order_id, 'Part Used', jsonb_build_object(
            'inventory_item_id', NEW.inventory_item_id,
            'quantity', NEW.quantity
        ));
    END IF;
    
    -- Handle updates (quantity changes)
    IF TG_OP = 'UPDATE' AND OLD.quantity != NEW.quantity THEN
        UPDATE inventory_stock
        SET quantity_on_hand = quantity_on_hand + OLD.quantity - NEW.quantity,
            reserved_quantity = reserved_quantity - OLD.quantity + NEW.quantity
        WHERE inventory_item_id = NEW.inventory_item_id
        AND garage_id = NEW.garage_id;
    END IF;
    
    -- Handle deletes (part removed from work order)
    IF TG_OP = 'DELETE' THEN
        UPDATE inventory_stock
        SET quantity_on_hand = quantity_on_hand + OLD.quantity,
            reserved_quantity = reserved_quantity - OLD.quantity
        WHERE inventory_item_id = OLD.inventory_item_id
        AND garage_id = OLD.garage_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-decrement inventory on part usage
CREATE TRIGGER decrement_inventory_trigger
    AFTER INSERT OR UPDATE OR DELETE ON work_order_parts
    FOR EACH ROW
    EXECUTE FUNCTION decrement_inventory_on_part_usage();

-- Function: Winterization protocol check
CREATE OR REPLACE FUNCTION check_winterization_protocol()
RETURNS TRIGGER AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    winter_start DATE;
    winter_deadline DATE;
BEGIN
    -- Set winter dates (October 1 to November 1)
    winter_start := DATE_TRUNC('year', current_date) + INTERVAL '9 months';
    winter_deadline := DATE_TRUNC('year', current_date) + INTERVAL '10 months';
    
    -- If it's after October 1st and before November 1st
    IF current_date >= winter_start AND current_date < winter_deadline THEN
        -- Check if vehicle is winterized
        IF NOT EXISTS (
            SELECT 1 FROM vehicles
            WHERE id = NEW.vehicle_id
            AND winterized_bool = TRUE
        ) THEN
            -- Inject winter checklist into work order description
            NEW.description := COALESCE(NEW.description || E'\n\n', '') || 
                'WINTERIZATION CHECKLIST REQUIRED:' || E'\n' ||
                '- Anti-gel additive check' || E'\n' ||
                '- Heater system check' || E'\n' ||
                '- Tire tread depth check (must be > 4/32")' || E'\n' ||
                '- Battery condition check' || E'\n' ||
                '- Windshield wiper condition';
        END IF;
    END IF;
    
    -- If it's after November 1st and vehicle is not winterized, set to OUT_OF_SERVICE
    IF current_date >= winter_deadline THEN
        IF NOT EXISTS (
            SELECT 1 FROM vehicles
            WHERE id = NEW.vehicle_id
            AND winterized_bool = TRUE
        ) THEN
            UPDATE vehicles
            SET status = 'OUT_OF_SERVICE'
            WHERE id = NEW.vehicle_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check winterization on work order creation
CREATE TRIGGER check_winterization_trigger
    BEFORE INSERT ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION check_winterization_protocol();

-- Function: Calculate driver risk score
CREATE OR REPLACE FUNCTION calculate_driver_risk_score(
    p_driver_id UUID,
    p_month DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_miles_driven INTEGER;
    v_avoidable_repair_count INTEGER;
    v_cost_per_mile DECIMAL;
    v_risk_score INTEGER;
BEGIN
    -- Get miles driven for the month
    SELECT COALESCE(SUM(odometer), 0) INTO v_miles_driven
    FROM vehicles
    WHERE current_driver_id = p_driver_id;
    
    -- Count avoidable repairs (brakes, suspension)
    SELECT COUNT(*) INTO v_avoidable_repair_count
    FROM work_orders wo
    JOIN vehicles v ON wo.vehicle_id = v.id
    WHERE v.current_driver_id = p_driver_id
    AND wo.type = 'Repair'
    AND wo.issue_type IN ('Brakes', 'Suspension', 'Tires')
    AND DATE_TRUNC('month', wo.created_at) = DATE_TRUNC('month', p_month);
    
    -- Calculate cost per mile
    SELECT COALESCE(
        SUM(wo.cost) / NULLIF(v_miles_driven, 0),
        0
    ) INTO v_cost_per_mile
    FROM work_orders wo
    JOIN vehicles v ON wo.vehicle_id = v.id
    WHERE v.current_driver_id = p_driver_id
    AND DATE_TRUNC('month', wo.created_at) = DATE_TRUNC('month', p_month);
    
    -- Calculate risk score (0-100)
    -- Higher score = higher risk
    v_risk_score := LEAST(100, GREATEST(0,
        (v_avoidable_repair_count * 20) + 
        (CASE WHEN v_cost_per_mile > 0.10 THEN 30 ELSE 0 END) +
        (CASE WHEN v_miles_driven > 5000 THEN 10 ELSE 0 END)
    ));
    
    -- Upsert driver risk score
    INSERT INTO driver_risk_scores (month, driver_id, miles_driven, avoidable_repair_count, cost_per_mile, risk_score)
    VALUES (DATE_TRUNC('month', p_month), p_driver_id, v_miles_driven, v_avoidable_repair_count, v_cost_per_mile, v_risk_score)
    ON CONFLICT (month, driver_id)
    DO UPDATE SET
        miles_driven = EXCLUDED.miles_driven,
        avoidable_repair_count = EXCLUDED.avoidable_repair_count,
        cost_per_mile = EXCLUDED.cost_per_mile,
        risk_score = EXCLUDED.risk_score,
        updated_at = NOW();
    
    RETURN v_risk_score;
END;
$$ LANGUAGE plpgsql;

-- Function: Populate daily garage stats (to be called by cron)
CREATE OR REPLACE FUNCTION populate_daily_garage_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO daily_garage_stats (date, garage_id, total_vehicles, vehicles_down, vehicles_available, vehicles_in_service, vehicles_in_maintenance, availability_rate)
    SELECT
        p_date,
        g.id,
        COUNT(v.id) as total_vehicles,
        COUNT(CASE WHEN v.status = 'OUT_OF_SERVICE' THEN 1 END) as vehicles_down,
        COUNT(CASE WHEN v.status = 'AVAILABLE' THEN 1 END) as vehicles_available,
        COUNT(CASE WHEN v.status = 'IN_SERVICE' THEN 1 END) as vehicles_in_service,
        COUNT(CASE WHEN v.status = 'IN_MAINTENANCE' THEN 1 END) as vehicles_in_maintenance,
        CASE
            WHEN COUNT(v.id) > 0 THEN
                (COUNT(CASE WHEN v.status = 'AVAILABLE' THEN 1 END)::DECIMAL / COUNT(v.id)::DECIMAL) * 100
            ELSE 0
        END as availability_rate
    FROM garages g
    LEFT JOIN vehicles v ON v.garage_id = g.id
    GROUP BY g.id
    ON CONFLICT (date, garage_id)
    DO UPDATE SET
        total_vehicles = EXCLUDED.total_vehicles,
        vehicles_down = EXCLUDED.vehicles_down,
        vehicles_available = EXCLUDED.vehicles_available,
        vehicles_in_service = EXCLUDED.vehicles_in_service,
        vehicles_in_maintenance = EXCLUDED.vehicles_in_maintenance,
        availability_rate = EXCLUDED.availability_rate;
END;
$$ LANGUAGE plpgsql;

