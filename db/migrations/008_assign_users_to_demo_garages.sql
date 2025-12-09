-- Transitland Fleet OS - Assign Test Users to Demo Garages
-- This script reassigns the test users to North Garage so they can see the demo data
-- Run this AFTER running 007_seed_demo_data.sql

-- Assign all test users to North Garage
UPDATE users
SET garage_id = '11111111-1111-1111-1111-111111111111'  -- North Garage
WHERE email IN (
  'mechanic@transitland.test',
  'ops@transitland.test',
  'clerk@transitland.test',
  'driver@transitland.test'
)
AND garage_id = '00000000-0000-0000-0000-000000000001';  -- Old Main Transit Garage

-- Verification
-- SELECT u.name, u.email, u.role, g.name as garage_name
-- FROM users u
-- LEFT JOIN garages g ON u.garage_id = g.id
-- WHERE u.email IN (
--   'mechanic@transitland.test',
--   'ops@transitland.test',
--   'clerk@transitland.test',
--   'driver@transitland.test'
-- );

