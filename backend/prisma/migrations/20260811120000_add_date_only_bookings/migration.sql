ALTER TABLE "Appointment"
ADD COLUMN IF NOT EXISTS "scheduledDate" DATE;

UPDATE "Appointment" AS appointment
SET "scheduledDate" = (slot."startsAt" AT TIME ZONE 'Asia/Kolkata')::date
FROM "TimeSlot" AS slot
WHERE appointment."timeSlotId" = slot.id
  AND appointment."scheduledDate" IS NULL;

ALTER TABLE "Appointment"
ALTER COLUMN "timeSlotId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Appointment_scheduledDate_idx"
ON "Appointment"("scheduledDate");
