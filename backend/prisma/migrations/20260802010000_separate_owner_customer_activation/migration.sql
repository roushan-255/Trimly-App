-- Owner registration used to create customer access automatically. Identify only
-- those generated customer profiles: they were created with or after the owner
-- profile and have never been used for customer activity.
CREATE TEMPORARY TABLE "_OwnerOnlyCustomerCleanup" AS
SELECT
  "customer"."id" AS "customerId",
  "customer"."userId" AS "userId"
FROM "CustomerProfile" AS "customer"
INNER JOIN "ShopOwnerProfile" AS "owner"
  ON "owner"."userId" = "customer"."userId"
WHERE "customer"."createdAt" >= "owner"."createdAt"
  AND "customer"."walletBalance" = 0
  AND NOT EXISTS (
    SELECT 1 FROM "Appointment"
    WHERE "Appointment"."customerId" = "customer"."id"
  )
  AND NOT EXISTS (
    SELECT 1 FROM "Review"
    WHERE "Review"."customerId" = "customer"."id"
  )
  AND NOT EXISTS (
    SELECT 1 FROM "FavoriteBarber"
    WHERE "FavoriteBarber"."customerId" = "customer"."id"
  )
  AND NOT EXISTS (
    SELECT 1 FROM "FavoriteShop"
    WHERE "FavoriteShop"."customerId" = "customer"."id"
  );

UPDATE "User"
SET "roles" = array_remove("roles", 'CUSTOMER'::"UserRole")
WHERE "id" IN (
  SELECT "userId" FROM "_OwnerOnlyCustomerCleanup"
);

DELETE FROM "CustomerProfile"
WHERE "id" IN (
  SELECT "customerId" FROM "_OwnerOnlyCustomerCleanup"
);

DROP TABLE "_OwnerOnlyCustomerCleanup";
