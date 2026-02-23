/*
  # Add min/max deficit target columns to profiles table

  ## Summary
  Replaces the single `target_deficit` with two new columns:
  - `min_deficit_target`: the minimum daily caloric deficit the user wants to achieve
  - `max_deficit_target`: the maximum daily caloric deficit (upper bound / safety cap)

  ## Changes
  - `profiles.min_deficit_target` (integer, default 500): minimum daily deficit in kcal
  - `profiles.max_deficit_target` (integer, default 1000): maximum daily deficit in kcal
  - `profiles.target_deficit` is kept for backward compatibility (not dropped)

  ## Notes
  1. Both columns default to sensible values so existing rows are not broken.
  2. No data is deleted.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'min_deficit_target'
  ) THEN
    ALTER TABLE profiles ADD COLUMN min_deficit_target integer NOT NULL DEFAULT 500;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'max_deficit_target'
  ) THEN
    ALTER TABLE profiles ADD COLUMN max_deficit_target integer NOT NULL DEFAULT 1000;
  END IF;
END $$;
