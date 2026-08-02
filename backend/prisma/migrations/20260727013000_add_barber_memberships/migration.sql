-- Separate barber identity from shop membership while preserving current links.
CREATE TYPE "BarberMembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'REVOKED');

ALTER TABLE "Barber"
ADD COLUMN "isManaged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isDiscoverable" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Barber"
SET "isManaged" = true,
    "isDiscoverable" = false
WHERE "userId" IS NULL;

CREATE TABLE "ShopBarberMembership" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "barberId" UUID NOT NULL,
    "invitedByOwnerId" UUID,
    "status" "BarberMembershipStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopBarberMembership_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ShopBarberMembership" (
    "id",
    "shopId",
    "barberId",
    "status",
    "invitedAt",
    "respondedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    "shopId",
    "id",
    'ACTIVE'::"BarberMembershipStatus",
    "createdAt",
    "createdAt",
    "createdAt",
    "updatedAt"
FROM "Barber";

CREATE UNIQUE INDEX "ShopBarberMembership_shopId_barberId_key"
ON "ShopBarberMembership"("shopId", "barberId");

CREATE INDEX "ShopBarberMembership_shopId_status_idx"
ON "ShopBarberMembership"("shopId", "status");

CREATE INDEX "ShopBarberMembership_barberId_status_idx"
ON "ShopBarberMembership"("barberId", "status");

CREATE INDEX "ShopBarberMembership_invitedByOwnerId_idx"
ON "ShopBarberMembership"("invitedByOwnerId");

ALTER TABLE "ShopBarberMembership"
ADD CONSTRAINT "ShopBarberMembership_shopId_fkey"
FOREIGN KEY ("shopId") REFERENCES "Shop"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShopBarberMembership"
ADD CONSTRAINT "ShopBarberMembership_barberId_fkey"
FOREIGN KEY ("barberId") REFERENCES "Barber"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShopBarberMembership"
ADD CONSTRAINT "ShopBarberMembership_invitedByOwnerId_fkey"
FOREIGN KEY ("invitedByOwnerId") REFERENCES "ShopOwnerProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Barber" DROP CONSTRAINT "Barber_shopId_fkey";
DROP INDEX "Barber_shopId_idx";
ALTER TABLE "Barber" DROP COLUMN "shopId";
