/*
  # Create entries table for Defit fitness tracker

  1. New Tables
    - `entries`
      - `id` (uuid, primary key) - unique entry identifier
      - `device_id` (text, not null) - identifies the device/browser session
      - `type` (text, not null) - either 'food' or 'workout'
      - `name` (text, not null) - descriptive name of the entry
      - `kcal` (integer, not null, default 0) - calories
      - `carbs` (integer, not null, default 0) - carbohydrates in grams
      - `protein` (integer, not null, default 0) - protein in grams
      - `fat` (integer, not null, default 0) - fat in grams
      - `entry_date` (date, not null, default today) - the date this entry belongs to
      - `created_at` (timestamptz, default now) - when the entry was created

  2. Indexes
    - Index on (device_id, entry_date) for fast daily lookups

  3. Security
    - Enable RLS on `entries` table
    - Policies restrict access by device_id passed via request header
    - Each device can only read, insert, and delete its own entries
*/

CREATE TABLE IF NOT EXISTS entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('food', 'workout')),
  name text NOT NULL DEFAULT '',
  kcal integer NOT NULL DEFAULT 0,
  carbs integer NOT NULL DEFAULT 0,
  protein integer NOT NULL DEFAULT 0,
  fat integer NOT NULL DEFAULT 0,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entries_device_date ON entries (device_id, entry_date);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devices can read own entries"
  ON entries FOR SELECT
  TO anon
  USING (device_id = current_setting('request.header.x-device-id', true));

CREATE POLICY "Devices can insert own entries"
  ON entries FOR INSERT
  TO anon
  WITH CHECK (device_id = current_setting('request.header.x-device-id', true));

CREATE POLICY "Devices can delete own entries"
  ON entries FOR DELETE
  TO anon
  USING (device_id = current_setting('request.header.x-device-id', true));
