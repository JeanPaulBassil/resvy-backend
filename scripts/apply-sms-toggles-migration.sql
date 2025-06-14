-- Production Migration: Add SMS Notification Toggles
-- Run this script on production database to add SMS notification toggle fields

-- Add SMS notification toggle columns to Restaurant table
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "smsConfirmationEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "smsCancellationEnabled" BOOLEAN NOT NULL DEFAULT true;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Restaurant' 
AND column_name IN ('smsConfirmationEnabled', 'smsCancellationEnabled');

-- Show current SMS settings for all restaurants
SELECT id, name, "smsEnabled", "smsConfirmationEnabled", "smsCancellationEnabled"
FROM "Restaurant" 
WHERE "smsEnabled" = true;

COMMIT; 