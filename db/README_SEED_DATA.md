# Test User Accounts Setup Guide

This guide explains how to create test accounts for each persona in Transitland Fleet OS.

## Test Accounts Summary

| Role | Email | Password | Dashboard Route |
|------|-------|----------|-----------------|
| Mechanic | `mechanic@transitland.test` | `TestMechanic123!` | `/mechanic` |
| Ops Manager | `ops@transitland.test` | `TestOps123!` | `/ops` |
| Parts Clerk | `clerk@transitland.test` | `TestClerk123!` | `/clerk` |
| Driver | `driver@transitland.test` | `TestDriver123!` | `/driver` |

## Setup Methods

### Method 1: Using Supabase Dashboard (Recommended - Easiest)

1. **Go to Supabase Dashboard** → Your Project → **Authentication** → **Users**

2. **Create each user** by clicking "Add User" and filling in:
   - **Mechanic:**
     - Email: `mechanic@transitland.test`
     - Password: `TestMechanic123!`
     - Auto Confirm User: ✅ (checked)
   
   - **Ops Manager:**
     - Email: `ops@transitland.test`
     - Password: `TestOps123!`
     - Auto Confirm User: ✅ (checked)
   
   - **Parts Clerk:**
     - Email: `clerk@transitland.test`
     - Password: `TestClerk123!`
     - Auto Confirm User: ✅ (checked)
   
   - **Driver:**
     - Email: `driver@transitland.test`
     - Password: `TestDriver123!`
     - Auto Confirm User: ✅ (checked)

3. **Copy the User UUIDs** from the Users list (you'll see them in the table)

4. **Run the SQL script** `006_seed_users_after_auth.sql` in the SQL Editor
   - This script automatically links the auth users to the `users` table
   - It creates role-specific profiles (mechanics, drivers)
   - It assigns all users to the test garage

### Method 2: Using SQL Scripts (Advanced)

If you prefer to create users via SQL:

1. **Run** `005_create_auth_users.sql` in Supabase SQL Editor
   - This creates auth users directly in the database
   - Note: Requires proper permissions and may need adjustments based on your Supabase version

2. **Run** `006_seed_users_after_auth.sql` to link users and create profiles

### Method 3: Manual SQL (If scripts don't work)

1. Create auth users via Dashboard (Method 1, step 1-2)

2. Get the UUIDs from the Users table

3. Run this SQL, replacing the UUIDs:

```sql
-- Create garage
INSERT INTO garages (id, name, total_bays, timezone, address)
VALUES ('00000000-0000-0000-0000-000000000001', 'Main Transit Garage', 12, 'America/New_York', '123 Main St')
ON CONFLICT (id) DO NOTHING;

-- Mechanic (replace MECHANIC_UUID with actual UUID)
INSERT INTO users (id, auth_id, role, garage_id, name, email, phone)
VALUES (
  'MECHANIC_UUID',  -- Replace with actual UUID
  'MECHANIC_UUID',  -- Replace with actual UUID
  'mechanic',
  '00000000-0000-0000-0000-000000000001',
  'John Mechanic',
  'mechanic@transitland.test',
  '555-0101'
);

INSERT INTO mechanics (user_id, specialty, shift_pattern, certification_level)
VALUES (
  'MECHANIC_UUID',  -- Replace with actual UUID
  'General Maintenance',
  'Day Shift',
  'ASE Certified'
);

-- Repeat for other roles...
```

## Verification

After setup, verify the accounts with these queries:

```sql
-- Check all users
SELECT id, email, role, name, garage_id 
FROM users 
ORDER BY role;

-- Check mechanics
SELECT m.id, u.name, u.email, m.specialty 
FROM mechanics m 
JOIN users u ON m.user_id = u.id;

-- Check drivers
SELECT d.id, u.name, u.email, d.license_expiry 
FROM drivers d 
JOIN users u ON d.user_id = u.id;
```

## Troubleshooting

### Users can't log in
- Verify users are created in `auth.users` table
- Check that `email_confirmed_at` is set (users created via Dashboard should have this)
- Verify the `users` table has matching records with correct `id` matching `auth.users.id`

### Users see "Unauthorized" page
- Check that the `role` field in the `users` table matches the expected role
- Verify `garage_id` is set (users need to be assigned to a garage)

### Missing role-specific profiles
- Mechanics need entries in the `mechanics` table
- Drivers need entries in the `drivers` table
- Run the `006_seed_users_after_auth.sql` script to create these

## Files

- `004_seed_test_data.sql` - Manual template (requires UUID replacement)
- `005_create_auth_users.sql` - Creates auth users via SQL (may need permissions)
- `006_seed_users_after_auth.sql` - Links auth users to profiles (recommended)

