-- A salon brand groups independently managed physical shop locations.
CREATE TABLE "SalonBrand" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonBrand_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Shop"
ADD COLUMN "brandId" UUID,
ADD COLUMN "branchName" TEXT;

CREATE INDEX "SalonBrand_ownerId_idx" ON "SalonBrand"("ownerId");
CREATE INDEX "Shop_brandId_idx" ON "Shop"("brandId");
CREATE UNIQUE INDEX "Shop_brandId_branchName_key" ON "Shop"("brandId", "branchName");

ALTER TABLE "SalonBrand"
ADD CONSTRAINT "SalonBrand_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "ShopOwnerProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Shop"
ADD CONSTRAINT "Shop_brandId_fkey"
FOREIGN KEY ("brandId") REFERENCES "SalonBrand"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
