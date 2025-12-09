-- Transitland Fleet OS - Create Auth Users Script
-- This script uses Supabase's auth.admin_create_user function to create users
-- Run this in Supabase SQL Editor with proper permissions

-- NOTE: This requires the auth schema and admin functions to be available
-- If these functions don't work, create users via Supabase Dashboard instead

-- ============================================================================
-- CREATE AUTH USERS
-- ============================================================================

-- Mechanic User
DO $$
DECLARE
  mechanic_user_id UUID;
BEGIN
  -- Create auth user
  SELECT id INTO mechanic_user_id
  FROM auth.users
  WHERE email = 'mechanic@transitland.test';
  
  IF mechanic_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'mechanic@transitland.test',
      crypt('TestMechanic123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"John Mechanic"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO mechanic_user_id;
    
    RAISE NOTICE 'Created mechanic user with ID: %', mechanic_user_id;
  ELSE
    RAISE NOTICE 'Mechanic user already exists with ID: %', mechanic_user_id;
  END IF;
END $$;

-- Ops Manager User
DO $$
DECLARE
  ops_user_id UUID;
BEGIN
  SELECT id INTO ops_user_id
  FROM auth.users
  WHERE email = 'ops@transitland.test';
  
  IF ops_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'ops@transitland.test',
      crypt('TestOps123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Sarah Operations"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO ops_user_id;
    
    RAISE NOTICE 'Created ops manager user with ID: %', ops_user_id;
  ELSE
    RAISE NOTICE 'Ops manager user already exists with ID: %', ops_user_id;
  END IF;
END $$;

-- Parts Clerk User
DO $$
DECLARE
  clerk_user_id UUID;
BEGIN
  SELECT id INTO clerk_user_id
  FROM auth.users
  WHERE email = 'clerk@transitland.test';
  
  IF clerk_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'clerk@transitland.test',
      crypt('TestClerk123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Mike Parts"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO clerk_user_id;
    
    RAISE NOTICE 'Created parts clerk user with ID: %', clerk_user_id;
  ELSE
    RAISE NOTICE 'Parts clerk user already exists with ID: %', clerk_user_id;
  END IF;
END $$;

-- Driver User
DO $$
DECLARE
  driver_user_id UUID;
BEGIN
  SELECT id INTO driver_user_id
  FROM auth.users
  WHERE email = 'driver@transitland.test';
  
  IF driver_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'driver@transitland.test',
      crypt('TestDriver123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Alex Driver"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO driver_user_id;
    
    RAISE NOTICE 'Created driver user with ID: %', driver_user_id;
  ELSE
    RAISE NOTICE 'Driver user already exists with ID: %', driver_user_id;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check created auth users
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email IN (
  'mechanic@transitland.test',
  'ops@transitland.test',
  'clerk@transitland.test',
  'driver@transitland.test'
)
ORDER BY email;

