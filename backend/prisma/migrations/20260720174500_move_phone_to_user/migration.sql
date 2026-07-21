-- Move the shared contact number from the customer-only profile to User.
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

UPDATE "User" AS "user"
SET "phone" = "customerProfile"."phone"
FROM "CustomerProfile" AS "customerProfile"
WHERE "customerProfile"."userId" = "user"."id"
  AND "customerProfile"."phone" IS NOT NULL;

ALTER TABLE "CustomerProfile" DROP COLUMN "phone";
