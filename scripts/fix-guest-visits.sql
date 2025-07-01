-- Script to fix guest visit counts based on completed reservations
-- This script updates visitCount and lastVisit for all guests based on their completed reservations

-- Update guest visit counts and last visit dates based on completed reservations
UPDATE "Guest" SET 
  "visitCount" = COALESCE(reservation_data.completed_count, 0),
  "lastVisit" = reservation_data.last_visit_date,
  "updatedAt" = NOW()
FROM (
  SELECT 
    r."guestId",
    COUNT(*) as completed_count,
    MAX(r."date") as last_visit_date
  FROM "Reservation" r
  WHERE r."status" = 'COMPLETED'
  GROUP BY r."guestId"
) as reservation_data
WHERE "Guest"."id" = reservation_data."guestId";

-- For guests with no completed reservations, ensure visitCount is 0 and lastVisit is null
UPDATE "Guest" SET 
  "visitCount" = 0,
  "lastVisit" = NULL,
  "updatedAt" = NOW()
WHERE "id" NOT IN (
  SELECT DISTINCT "guestId" 
  FROM "Reservation" 
  WHERE "status" = 'COMPLETED'
) AND ("visitCount" != 0 OR "lastVisit" IS NOT NULL); 