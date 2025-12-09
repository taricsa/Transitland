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

-- Policy: Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated users to upload work order photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-order-photos' AND
  (storage.foldername(name))[1] = 'work-orders'
);

-- Policy: Allow authenticated users to read photos
CREATE POLICY "Allow authenticated users to read work order photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-order-photos' AND
  (storage.foldername(name))[1] = 'work-orders'
);

-- Policy: Allow authenticated users to delete their own photos
CREATE POLICY "Allow authenticated users to delete work order photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-order-photos' AND
  (storage.foldername(name))[1] = 'work-orders'
);

-- Note: The photo upload functionality in the app will:
-- 1. Upload files to: work-order-photos/work-orders/{work_order_id}/{timestamp}.{ext}
-- 2. Create a work_order_event with event_type 'Photo Added' and metadata containing the URL
-- 3. Photos are retrieved by querying work_order_events where event_type = 'Photo Added'

