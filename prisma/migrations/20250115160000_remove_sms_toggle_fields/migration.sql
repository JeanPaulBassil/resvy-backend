-- Remove SMS notification toggle fields from Restaurant table
-- These fields were added for individual SMS control but are being removed
-- to simplify SMS configuration back to a single toggle

-- Remove smsConfirmationEnabled column if it exists
ALTER TABLE "Restaurant" DROP COLUMN IF EXISTS "smsConfirmationEnabled";

-- Remove smsCancellationEnabled column if it exists  
ALTER TABLE "Restaurant" DROP COLUMN IF EXISTS "smsCancellationEnabled"; 