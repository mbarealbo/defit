/*
  # Add user_id to entries and update RLS policies

  ## Summary
  This migration transitions the app from device-based identification to
  proper Supabase Auth user authentication.

  ## Changes

  ### Modified Tables
  - `entries`: Add `user_id` column (uuid, references auth.users)

  ### Security Changes
  - Drop all existing permissive and broken RLS policies
  - Create new policies that enforce ownership via `auth.uid()`
  - Each user can only read, insert, update, and delete their own entries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE entries ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DROP POLICY IF EXISTS "Anon can read entries" ON entries;
DROP POLICY IF EXISTS "Anon can insert entries" ON entries;
DROP POLICY IF EXISTS "Anon can delete entries" ON entries;
DROP POLICY IF EXISTS "Devices can update own entries" ON entries;
DROP POLICY IF EXISTS "Users can read own entries" ON entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON entries;
DROP POLICY IF EXISTS "Users can update own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON entries;

CREATE POLICY "Users can read own entries"
  ON entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
