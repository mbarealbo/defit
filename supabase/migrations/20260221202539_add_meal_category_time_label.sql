/*
  # Add meal_category and time_label to entries

  1. Changes
    - `entries` table gets two new nullable columns:
      - `meal_category` (text) - one of the Italian meal period labels (e.g. "colazione", "pranzo", "cena", etc.)
      - `time_label` (text) - HH:mm string captured at insertion time

  2. Notes
    - Both columns are nullable so existing rows are unaffected
    - An UPDATE policy is added so the device can update its own entries (needed for drag-to-reassign category)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'meal_category'
  ) THEN
    ALTER TABLE entries ADD COLUMN meal_category text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'time_label'
  ) THEN
    ALTER TABLE entries ADD COLUMN time_label text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'entries' AND policyname = 'Devices can update own entries'
  ) THEN
    CREATE POLICY "Devices can update own entries"
      ON entries FOR UPDATE
      TO anon
      USING (device_id = current_setting('request.header.x-device-id', true))
      WITH CHECK (device_id = current_setting('request.header.x-device-id', true));
  END IF;
END $$;
