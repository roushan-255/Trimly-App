ALTER TABLE "Appointment"
ADD COLUMN "bookingGroupId" UUID;

-- Existing appointments become one-item bookings. New multi-service checkouts
-- explicitly reuse one group id for every appointment created together.
UPDATE "Appointment"
SET "bookingGroupId" = "id";

ALTER TABLE "Appointment"
ALTER COLUMN "bookingGroupId" SET NOT NULL,
ALTER COLUMN "bookingGroupId" SET DEFAULT gen_random_uuid();

-- Cancelled and rescheduled appointments retain their historical time slot.
-- Slot availability, plus serializable booking transactions, prevents active
-- double bookings while allowing released slots to be reserved again.
DROP INDEX "Appointment_timeSlotId_key";

CREATE INDEX "Appointment_customerId_bookingGroupId_idx"
ON "Appointment"("customerId", "bookingGroupId");

CREATE INDEX "Appointment_timeSlotId_idx"
ON "Appointment"("timeSlotId");
