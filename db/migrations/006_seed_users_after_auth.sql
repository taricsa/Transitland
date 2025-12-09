-- Transitland Fleet OS - Seed Users After Auth Creation
-- Run this AFTER running 005_create_auth_users.sql or creating users via Dashboard
-- This script links auth users to the users table and creates role-specific profiles

-- ============================================================================
-- STEP 1: Get auth user IDs and create user records
-- ============================================================================

-- Create test garage if it doesn't exist
INSERT INTO garages (id, name, total_bays, timezone, address)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Main Transit Garage', 12, 'America/New_York', '123 Main St, Transit City, ST 12345')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MECHANIC
-- ============================================================================
INSERT INTO users (id, auth_id, role, garage_id, name, email, phone)
SELECT 
  au.id,
  au.id,
  'mechanic',
  '00000000-0000-0000-0000-000000000001',
  'John Mechanic',
  'mechanic@transitland.test',
  '555-0101'
FROM auth.users au
WHERE au.email = 'mechanic@transitland.test'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  garage_id = EXCLUDED.garage_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- Create mechanic profile
INSERT INTO mechanics (user_id, specialty, shift_pattern, certification_level)
SELECT 
  u.id,
  'General Maintenance',
  'Day Shift',
  'ASE Certified'
FROM users u
WHERE u.email = 'mechanic@transitland.test'
ON CONFLICT (user_id) DO UPDATE SET
  specialty = EXCLUDED.specialty,
  shift_pattern = EXCLUDED.shift_pattern,
  certification_level = EXCLUDED.certification_level;

-- ============================================================================
-- OPS MANAGER
-- ============================================================================
INSERT INTO users (id, auth_id, role, garage_id, name, email, phone)
SELECT 
  au.id,
  au.id,
  'ops_manager',
  '00000000-0000-0000-0000-000000000001',
  'Sarah Operations',
  'ops@transitland.test',
  '555-0102'
FROM auth.users au
WHERE au.email = 'ops@transitland.test'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  garage_id = EXCLUDED.garage_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- ============================================================================
-- PARTS CLERK
-- ============================================================================
INSERT INTO users (id, auth_id, role, garage_id, name, email, phone)
SELECT 
  au.id,
  au.id,
  'parts_clerk',
  '00000000-0000-0000-0000-000000000001',
  'Mike Parts',
  'clerk@transitland.test',
  '555-0103'
FROM auth.users au
WHERE au.email = 'clerk@transitland.test'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  garage_id = EXCLUDED.garage_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- ============================================================================
-- DRIVER
-- ============================================================================
INSERT INTO users (id, auth_id, role, garage_id, name, email, phone)
SELECT 
  au.id,
  au.id,
  'driver',
  '00000000-0000-0000-0000-000000000001',
  'Alex Driver',
  'driver@transitland.test',
  '555-0104'
FROM auth.users au
WHERE au.email = 'driver@transitland.test'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  garage_id = EXCLUDED.garage_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- Create driver profile
INSERT INTO drivers (user_id, license_expiry, current_vehicle_id)
SELECT 
  u.id,
  (CURRENT_DATE + INTERVAL '2 years')::DATE,
  NULL
FROM users u
WHERE u.email = 'driver@transitland.test'
ON CONFLICT (user_id) DO UPDATE SET
  license_expiry = EXCLUDED.license_expiry;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Uncomment to verify setup:

-- SELECT 'Users' as table_name, id, email, role, name, garage_id FROM users ORDER BY role;
-- SELECT 'Mechanics' as table_name, m.id, u.name, u.email, m.specialty FROM mechanics m JOIN users u ON m.user_id = u.id;
-- SELECT 'Drivers' as table_name, d.id, u.name, u.email, d.license_expiry FROM drivers d JOIN users u ON d.user_id = u.id;

