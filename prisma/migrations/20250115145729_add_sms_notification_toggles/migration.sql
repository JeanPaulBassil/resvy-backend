-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN "smsConfirmationEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Restaurant" ADD COLUMN "smsCancellationEnabled" BOOLEAN NOT NULL DEFAULT true; 