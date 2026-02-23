/*
  # Create user profiles table

  ## Summary
  Creates a profiles table to store user biometric data and caloric goals,
  enabling personalized BMR/TDEE calculations.

  ## New Tables
  - `profiles`
    - `id` (uuid, primary key, references auth.users)
    - `sex` (text: 'uomo' | 'donna')
    - `age` (integer, years)
    - `weight_kg` (numeric, kilograms)
    - `height_cm` (numeric, centimeters)
    - `activity_multiplier` (numeric, 1.2 - 1.9)
    - `target_deficit` (integer, kcal/day: 0, 250, 500, 1000)
    - `bmr` (integer, calculated Basal Metabolic Rate)
    - `tdee` (integer, calculated Total Daily Energy Expenditure)
    - `updated_at` (timestamptz)
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled on profiles table
  - Each user can only read and write their own profile
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sex text NOT NULL DEFAULT '',
  age integer NOT NULL DEFAULT 0,
  weight_kg numeric NOT NULL DEFAULT 0,
  height_cm numeric NOT NULL DEFAULT 0,
  activity_multiplier numeric NOT NULL DEFAULT 1.2,
  target_deficit integer NOT NULL DEFAULT 500,
  bmr integer NOT NULL DEFAULT 0,
  tdee integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
