-- Transitland Fleet OS - Test Data Seed Script
-- This script creates test accounts for each persona
-- Run this AFTER creating auth users in Supabase Dashboard or via API

-- Step 1: Create a test garage (if it doesn't exist)
INSERT INTO garages (id, name, total_bays, timezone, address)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Main Transit Garage', 12, 'America/New_York', '123 Main St, Transit City, ST 12345')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create user records in the users table
-- NOTE: You must create auth users FIRST in Supabase Dashboard (Authentication > Users > Add User)
-- Or use the Supabase Management API to create users
-- Then update the UUIDs below with the actual auth user IDs

-- IMPORTANT: Replace the UUIDs below with actual auth.users IDs after creating them in Supabase Dashboard
-- To get the auth user ID: Go to Authentication > Users, create user, copy the UUID

-- ============================================================================
-- MECHANIC PERSONA
-- ============================================================================
-- 1. Create auth user in Supabase Dashboard:
--    Email: mechanic@transitland.test
--    Password: TestMechanic123!
--    Copy the user UUID and replace 'MECHANIC_AUTH_UUID' below

INSERT INTO users (id, auth_id, role, garage_id, name, email, phone)
VALUES 
  (
    'MECHANIC_AUTH_UUID',  -- Replace with actual auth.users.id from Supabase Dashboard
    'MECHANIC_AUTH_UUID',  -- Replace with actual auth.users.id from Supabase Dashboard
    'mechanic',
    '00000000-0000-0000-0000-000000000001',
    'John Mechanic',
    'mechanic@transitland.test',
    '555-0101'
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  garage_id = EXCLUDED.garage_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- Create mechanic profile
INSERT INTO mechanics (user_id, specialty, shift_pattern, certification_level)
SELECT 
  id,
  'General Maintenance',
  'Day Shift',
  'ASE Certified'
FROM users
WHERE email = 'mechanic@transitland.test'
ON CONFLICT (user_id) DO UPDATE SET
  specialty = EXCLUDED.specialty,
  shift_pattern = EXCLUDED.shift_pattern,
  certification_level = EXCLUDED.certification_level;

-- ============================================================================
-- OPS MANAGER PERSONA
-- ============================================================================
-- 2. Create auth user in Supabase Dashboard:
--    Email: ops@transitland.test
--    Password: TestOps123!
--    Copy the user UUID and replace 'OPS_MANAGER_AUTH_UUID' below

INSERT INTO users (id, auth_id, role, garage_id, name, email, phone)
VALUES 
  (
    'OPS_MANAGER_AUTH_UUID',  -- Replace with actual auth.users.id from Supabase Dashboard
    'OPS_MANAGER_AUTH_UUID',  -- Replace with actual auth.users.id from Supabase Dashboard
    'ops_manager',
    '00000000-0000-0000-0000-000000000001',
    'Sarah Operations',
    'ops@transitland.test',
    '555-0102'
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  garage_id = EXCLUDED.garage_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- ============================================================================
-- PARTS CLERK PERSONA
-- ============================================================================
-- 3. Create auth user in Supabase Dashboard:
--    Email: clerk@transitland.test
--    Password: TestClerk123!
--    Copy the user UUID and replace 'PARTS_CLERK_AUTH_UUID' below

INSERT INTO users (id, auth_id, role, garage_id, name, email, phone)
VALUES 
  (
    'PARTS_CLERK_AUTH_UUID',  -- Replace with actual auth.users.id from Supabase Dashboard
    'PARTS_CLERK_AUTH_UUID',  -- Replace with actual auth.users.id from Supabase Dashboard
    'parts_clerk',
    '00000000-0000-0000-0000-000000000001',
    'Mike Parts',
    'clerk@transitland.test',
    '555-0103'
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  garage_id = EXCLUDED.garage_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- ============================================================================
-- DRIVER PERSONA
-- ============================================================================
-- 4. Create auth user in Supabase Dashboard:
--    Email: driver@transitland.test
--    Password: TestDriver123!
--    Copy the user UUID and replace 'DRIVER_AUTH_UUID' below

INSERT INTO users (id, auth_id, role, garage_id, name, email, phone)
VALUES 
  (
    'DRIVER_AUTH_UUID',  -- Replace with actual auth.users.id from Supabase Dashboard
    'DRIVER_AUTH_UUID',  -- Replace with actual auth.users.id from Supabase Dashboard
    'driver',
    '00000000-0000-0000-0000-000000000001',
    'Alex Driver',
    'driver@transitland.test',
    '555-0104'
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  garage_id = EXCLUDED.garage_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- Create driver profile
INSERT INTO drivers (user_id, license_expiry, current_vehicle_id)
SELECT 
  id,
  (CURRENT_DATE + INTERVAL '2 years')::DATE,
  NULL
FROM users
WHERE email = 'driver@transitland.test'
ON CONFLICT (user_id) DO UPDATE SET
  license_expiry = EXCLUDED.license_expiry;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the setup:

-- Check all users
-- SELECT id, email, role, name, garage_id FROM users ORDER BY role;

-- Check mechanics
-- SELECT m.id, u.name, u.email, m.specialty FROM mechanics m JOIN users u ON m.user_id = u.id;

-- Check drivers
-- SELECT d.id, u.name, u.email, d.license_expiry FROM drivers d JOIN users u ON d.user_id = u.id;

