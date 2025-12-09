# Supabase Setup Instructions for Migration 009

This document outlines the manual steps required in Supabase to complete the photo storage setup.

## Prerequisites

- Access to your Supabase project dashboard
- SQL Editor access in Supabase

## Step 1: Create Storage Bucket

1. Navigate to **Storage** in your Supabase Dashboard
2. Click **"New bucket"**
3. Configure the bucket:
   - **Name**: `work-order-photos`
   - **Public**: `false` (private bucket)
   - **File size limit**: `10MB`
   - **Allowed MIME types**: `image/*`
4. Click **"Create bucket"**

## Step 2: Run SQL Migration

1. Navigate to **SQL Editor** in your Supabase Dashboard
2. Open the file: `db/migrations/009_setup_photo_storage.sql`
3. Copy the entire contents of the file
4. Paste into the SQL Editor
5. Click **"Run"** to execute

This will:
- Create the `can_access_work_order()` SECURITY DEFINER function
- Create three RLS policies for the storage bucket:
  - **INSERT**: Allows authenticated users to upload photos
  - **SELECT**: Restricts photo access based on work order authorization
  - **DELETE**: Allows users to delete only their own photos

## Step 3: Verify Setup

### Verify Function Creation

Run this query in SQL Editor:
```sql
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'can_access_work_order';
```

Expected result: Should return one row with `prosecdef = true` (SECURITY DEFINER).

### Verify Storage Policies

Run this query in SQL Editor:
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%work order photo%';
```

Expected result: Should return 3 policies (INSERT, SELECT, DELETE).

### Test Photo Access (Optional)

1. Log in as a mechanic user
2. Navigate to a work order assigned to that mechanic
3. Try uploading a photo
4. Verify the photo appears in the gallery
5. Log in as a different user (e.g., ops manager from different garage)
6. Try accessing the same work order photo
7. Verify access is denied (should not see the photo)

## Security Notes

- The `can_access_work_order()` function uses `SECURITY DEFINER` to check permissions
- Photo access is restricted based on:
  - **Mechanics**: Can only view photos for work orders assigned to them
  - **Ops Managers**: Can view photos for work orders in their garage
  - **Parts Clerks**: Can view photos for work orders in their garage
  - **Other roles**: No access to work order photos
- Photo deletion is restricted to the photo owner (user who uploaded it)

## Troubleshooting

### Error: "function can_access_work_order does not exist"
- Make sure you ran the entire SQL migration file
- Check that the function was created: `\df can_access_work_order` in psql

### Error: "policy already exists"
- Drop the existing policy first:
  ```sql
  DROP POLICY IF EXISTS "Allow authenticated users to upload work order photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to read work order photos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete work order photos" ON storage.objects;
  ```
- Then re-run the migration

### Photos not accessible after upload
- Verify the storage bucket name matches exactly: `work-order-photos`
- Check that the RLS policies are active
- Verify the user has the correct role and garage assignment
- Check browser console for specific error messages

### Function returns false for valid users
- Verify the user exists in the `users` table with correct `role` and `garage_id`
- For mechanics, verify they have a corresponding record in the `mechanics` table
- Check that the work order exists and has the correct `assigned_mechanic_id` or `vehicle_id` → `garage_id`

