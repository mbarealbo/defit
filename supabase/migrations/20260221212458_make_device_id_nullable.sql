/*
  # Make device_id nullable on entries table

  ## Summary
  The app has migrated from device-based identification to user authentication.
  The device_id column is no longer populated on new entries and must be nullable.

  ## Changes
  - `entries.device_id`: changed from NOT NULL to nullable
*/

ALTER TABLE entries ALTER COLUMN device_id DROP NOT NULL;
