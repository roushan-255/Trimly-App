-- Reconstruct multi-service checkouts created before bookingGroupId existed.
-- Rows belong to the same booking only when they were created together for the
-- same customer, shop, and barber, and their service slots are consecutive.
WITH ordered_appointments AS (
  SELECT
    appointment."id",
    appointment."customerId",
    appointment."shopId",
    appointment."barberId",
    appointment."createdAt",
    slot."startsAt",
    slot."endsAt",
    CASE
      WHEN LAG(slot."endsAt") OVER (
        PARTITION BY
          appointment."customerId",
          appointment."shopId",
          appointment."barberId",
          appointment."createdAt"
        ORDER BY slot."startsAt", appointment."id"
      ) = slot."startsAt"
      THEN 0
      ELSE 1
    END AS "startsNewGroup"
  FROM "Appointment" AS appointment
  INNER JOIN "TimeSlot" AS slot ON slot."id" = appointment."timeSlotId"
), grouped_appointments AS (
  SELECT
    *,
    SUM("startsNewGroup") OVER (
      PARTITION BY "customerId", "shopId", "barberId", "createdAt"
      ORDER BY "startsAt", "id"
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS "slotGroup"
  FROM ordered_appointments
), reconstructed_groups AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY
        "customerId",
        "shopId",
        "barberId",
        "createdAt",
        "slotGroup"
      ORDER BY "startsAt", "id"
    ) AS "reconstructedBookingGroupId"
  FROM grouped_appointments
)
UPDATE "Appointment" AS appointment
SET "bookingGroupId" = reconstructed."reconstructedBookingGroupId"
FROM reconstructed_groups AS reconstructed
WHERE appointment."id" = reconstructed."id";
