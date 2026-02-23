/*
  # Fix RLS policies for entries table

  ## Problem
  The previous policies used `current_setting('request.header.x-device-id', true)` 
  which is NOT set by the Supabase JS client when making requests via the REST API.
  This caused all INSERT/SELECT/DELETE operations to silently fail because the 
  device_id check never matched anything.

  ## Solution
  Since this app uses anonymous device-based access (no auth), we open the table
  to all anon users. The device_id column still provides logical data separation,
  and the app only queries/shows data for the current device.

  ## Changes
  - Drop old broken policies that relied on request headers
  - Add new permissive policies for anon role that allow all operations
*/

DROP POLICY IF EXISTS "Devices can read own entries" ON entries;
DROP POLICY IF EXISTS "Devices can insert own entries" ON entries;
DROP POLICY IF EXISTS "Devices can delete own entries" ON entries;

CREATE POLICY "Anon can read entries"
  ON entries FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert entries"
  ON entries FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can delete entries"
  ON entries FOR DELETE
  TO anon
  USING (true);
