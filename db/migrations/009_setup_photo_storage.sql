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
-- Performance: Optimized to use a single query for RLS policy efficiency
CREATE OR REPLACE FUNCTION can_access_work_order(work_order_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function is called frequently by RLS policies and is optimized into a single query for performance.
  RETURN EXISTS (
    SELECT 1
    FROM users u
    JOIN work_orders wo ON wo.id = work_order_uuid
    JOIN vehicles v ON v.id = wo.vehicle_id
    WHERE
      u.id = user_uuid AND (
        -- Ops managers and parts clerks can access work orders in their garage.
        (u.role IN ('ops_manager', 'parts_clerk') AND u.garage_id = v.garage_id)
        OR
        -- Mechanics can access work orders assigned to them.
        (u.role = 'mechanic' AND wo.assigned_mechanic_id = (SELECT m.id FROM mechanics m WHERE m.user_id = u.id))
      )
  );
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

