/*
  # Create measurements table

  ## Summary
  Adds a body measurements tracking table for users to log their physical measurements over time.

  ## New Tables
  - `measurements`
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK to auth.users)
    - `date` (date, the measurement date)
    - `peso` (numeric, body weight in kg, nullable)
    - `petto` (numeric, chest circumference in cm, nullable)
    - `vita` (numeric, waist circumference in cm, nullable)
    - `fianchi` (numeric, hips circumference in cm, nullable)
    - `cosce` (numeric, thigh circumference in cm, nullable)
    - `braccia` (numeric, arms circumference in cm, nullable)
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Users can only read, insert, update, and delete their own measurements
*/

CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  peso numeric(5,2),
  petto numeric(5,1),
  vita numeric(5,1),
  fianchi numeric(5,1),
  cosce numeric(5,1),
  braccia numeric(5,1),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own measurements"
  ON measurements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
  ON measurements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
  ON measurements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
  ON measurements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS measurements_user_date_idx ON measurements(user_id, date DESC);
