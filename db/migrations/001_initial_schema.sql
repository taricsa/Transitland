-- Transitland Fleet OS - Initial Schema
-- Operational Tables (OLTP)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Garages table (Location Context)
CREATE TABLE garages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    total_bays INTEGER NOT NULL DEFAULT 0,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (Identity - extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('mechanic', 'ops_manager', 'parts_clerk', 'driver')),
    garage_id UUID REFERENCES garages(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mechanics table (Workforce Extension)
CREATE TABLE mechanics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialty VARCHAR(100),
    shift_pattern VARCHAR(50),
    certification_level VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table (Driver Extension)
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_expiry DATE,
    current_vehicle_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table (Asset Registry)
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vin VARCHAR(17) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'IN_SERVICE', 'MAINTENANCE_DUE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE')),
    garage_id UUID NOT NULL REFERENCES garages(id) ON DELETE RESTRICT,
    current_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    current_tire_set_id UUID,
    winterized_bool BOOLEAN DEFAULT FALSE,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    odometer INTEGER DEFAULT 0,
    last_service_date DATE,
    next_service_miles INTEGER,
    next_service_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work Orders table (Transactional Core)
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    assigned_mechanic_id UUID REFERENCES mechanics(id) ON DELETE SET NULL,
    priority VARCHAR(2) NOT NULL DEFAULT 'P3' CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
    status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Waiting', 'In Progress', 'Closed', 'Cancelled')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('Preventive', 'Repair')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    issue_type VARCHAR(100),
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    cost DECIMAL(10,2),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Work Order Events table (Audit Log)
CREATE TABLE work_order_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Status Change', 'Part Used', 'Note Added', 'Photo Added', 'Assigned', 'Unassigned')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id),
    metadata JSONB,
    description TEXT
);

-- Inventory Items table (Global Catalog)
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Seasonal', 'Regular')),
    min_threshold INTEGER NOT NULL DEFAULT 5,
    unit VARCHAR(50) DEFAULT 'each',
    supplier VARCHAR(255),
    cost DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Stock table (Local Stock per Garage)
CREATE TABLE inventory_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    garage_id UUID NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    location VARCHAR(100),
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(inventory_item_id, garage_id)
);

-- Work Order Parts table (Many-to-Many relationship)
CREATE TABLE work_order_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    garage_id UUID NOT NULL REFERENCES garages(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(work_order_id, inventory_item_id)
);

-- Indexes for performance
CREATE INDEX idx_vehicles_garage ON vehicles(garage_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_driver ON vehicles(current_driver_id);
CREATE INDEX idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX idx_work_orders_mechanic ON work_orders(assigned_mechanic_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_priority ON work_orders(priority);
CREATE INDEX idx_work_order_events_wo ON work_order_events(work_order_id);
CREATE INDEX idx_work_order_events_timestamp ON work_order_events(timestamp);
CREATE INDEX idx_inventory_stock_garage ON inventory_stock(garage_id);
CREATE INDEX idx_inventory_stock_item ON inventory_stock(inventory_item_id);
CREATE INDEX idx_users_garage ON users(garage_id);
CREATE INDEX idx_users_role ON users(role);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_garages_updated_at BEFORE UPDATE ON garages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mechanics_updated_at BEFORE UPDATE ON mechanics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_stock_updated_at BEFORE UPDATE ON inventory_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

