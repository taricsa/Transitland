-- Setup Supabase Storage for Work Order Photos
-- This migration creates the storage bucket and policies for work order photos

-- Note: Supabase Storage buckets are created via the Supabase Dashboard or API
-- This SQL file documents the required setup

-- 1. Create Storage Bucket (run in Supabase Dashboard > Storage)
-- Bucket name: work-order-photos
-- Public: false (private bucket)
-- File size limit: 10MB
-- Allowed MIME types: image/*

-- 2. Storage Policies (run in Supabase SQL Editor)

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow authenticated users to upload work order photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read work order photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete work order photos" ON storage.objects;

-- Policy: Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated users to upload work order photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-order-photos' AND
  (storage.foldername(name))[1] = 'work-orders'
);

-- Function: Check if user has access to a work order
-- Security: Uses SECURITY DEFINER to check work order permissions
CREATE OR REPLACE FUNCTION can_access_work_order(work_order_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role VARCHAR(50);
  user_garage_id UUID;
  mechanic_id UUID;
  work_order_garage_id UUID;
  work_order_assigned_mechanic_id UUID;
BEGIN
  -- Get user role and garage
  SELECT role, garage_id INTO user_role, user_garage_id
  FROM users
  WHERE id = user_uuid;

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get work order details
  SELECT 
    v.garage_id,
    wo.assigned_mechanic_id
  INTO 
    work_order_garage_id,
    work_order_assigned_mechanic_id
  FROM work_orders wo
  JOIN vehicles v ON wo.vehicle_id = v.id
  WHERE wo.id = work_order_uuid;

  IF work_order_garage_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check access based on role
  IF user_role = 'mechanic' THEN
    -- Mechanics can access work orders assigned to them
    IF work_order_assigned_mechanic_id IS NULL THEN
      RETURN FALSE;
    END IF;
    
    SELECT id INTO mechanic_id
    FROM mechanics
    WHERE user_id = user_uuid;
    
    RETURN mechanic_id = work_order_assigned_mechanic_id;
    
  ELSIF user_role = 'ops_manager' THEN
    -- Ops managers can access work orders in their garage
    RETURN user_garage_id = work_order_garage_id;
    
  ELSIF user_role = 'parts_clerk' THEN
    -- Parts clerks can access work orders in their garage
    RETURN user_garage_id = work_order_garage_id;
    
  ELSE
    -- Other roles (drivers, etc.) don't have access to work order photos
    RETURN FALSE;
  END IF;
END;
$$;

-- Policy: Allow authenticated users to read photos for work orders they have access to
-- Path structure: work-orders/{work_order_id}/{timestamp}.{ext}
-- Extract work_order_id from path: work-orders/{work_order_id}/...
-- Using regex to extract UUID from path after 'work-orders/'
CREATE POLICY "Allow authenticated users to read work order photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-order-photos' AND
  name LIKE 'work-orders/%' AND
  can_access_work_order(
    (regexp_match(name, 'work-orders/([a-f0-9-]{36})/'))[1]::UUID,
    auth.uid()
  )
);

-- Policy: Allow authenticated users to delete their own photos
-- Security: Users can only delete photos they uploaded (checked via owner column)
CREATE POLICY "Allow authenticated users to delete work order photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-order-photos' AND
  auth.uid() = owner
);

-- Note: The photo upload functionality in the app will:
-- 1. Upload files to: work-order-photos/work-orders/{work_order_id}/{timestamp}.{ext}
-- 2. Create a work_order_event with event_type 'Photo Added' and metadata containing the URL
-- 3. Photos are retrieved by querying work_order_events where event_type = 'Photo Added'

