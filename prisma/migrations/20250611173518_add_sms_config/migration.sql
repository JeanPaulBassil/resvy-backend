-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "smsCredits" INTEGER DEFAULT 0,
ADD COLUMN     "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsLastUpdated" TIMESTAMP(3),
ADD COLUMN     "smsPassword" TEXT,
ADD COLUMN     "smsSenderId" TEXT,
ADD COLUMN     "smsUsername" TEXT; 