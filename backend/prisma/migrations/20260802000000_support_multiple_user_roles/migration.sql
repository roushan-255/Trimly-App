-- Allow one account to use more than one portal while preserving its existing role.
ALTER TABLE "User"
ADD COLUMN "roles" "UserRole"[] NOT NULL DEFAULT ARRAY[]::"UserRole"[];

UPDATE "User"
SET "roles" = CASE
  WHEN "role" = 'SHOP_OWNER'::"UserRole"
    THEN ARRAY['CUSTOMER', 'SHOP_OWNER']::"UserRole"[]
  ELSE ARRAY["role"]::"UserRole"[]
END;

-- Existing owners also need a customer profile to use customer features.
INSERT INTO "CustomerProfile" (
  "id",
  "userId",
  "firstName",
  "lastName",
  "avatar",
  "walletBalance",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  "owner"."userId",
  "owner"."firstName",
  "owner"."lastName",
  "owner"."avatarUrl",
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ShopOwnerProfile" AS "owner"
LEFT JOIN "CustomerProfile" AS "customer"
  ON "customer"."userId" = "owner"."userId"
WHERE "customer"."id" IS NULL;

ALTER TABLE "User" DROP COLUMN "role";
