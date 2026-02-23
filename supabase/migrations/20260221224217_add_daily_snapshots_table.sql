/*
  # Add daily snapshots table

  ## Summary
  Creates a table to store per-day TDEE and deficit target snapshots.
  This ensures that past days always display their original targets,
  even if the user later updates their weight or activity level.

  ## New Tables
  - `daily_snapshots`
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK to auth.users)
    - `date` (date, the day this snapshot belongs to)
    - `tdee_snapshot` (integer, the TDEE in kcal active on this day)
    - `min_deficit_snapshot` (integer, minimum deficit target for this day)
    - `max_deficit_snapshot` (integer, maximum deficit target for this day)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    - UNIQUE constraint on (user_id, date) so upsert works cleanly

  ## Security
  - RLS enabled
  - Users can only read, insert, and update their own snapshots
*/

CREATE TABLE IF NOT EXISTS daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  tdee_snapshot integer NOT NULL DEFAULT 2000,
  min_deficit_snapshot integer NOT NULL DEFAULT 0,
  max_deficit_snapshot integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own snapshots"
  ON daily_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots"
  ON daily_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snapshots"
  ON daily_snapshots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS daily_snapshots_user_date_idx ON daily_snapshots(user_id, date);
