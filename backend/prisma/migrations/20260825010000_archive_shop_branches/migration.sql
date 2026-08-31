-- Branch deletion is implemented as archival so appointments, reviews, and
-- other historical records remain intact.
ALTER TABLE "Shop" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Shop_archivedAt_idx" ON "Shop"("archivedAt");

-- Only active branches need unique names. This also allows an owner to reuse a
-- branch name after its previous location has been archived.
DROP INDEX "Shop_brandId_branchName_key";
CREATE UNIQUE INDEX "Shop_active_brand_branch_name_key"
ON "Shop"("brandId", LOWER("branchName"))
WHERE "archivedAt" IS NULL AND "brandId" IS NOT NULL AND "branchName" IS NOT NULL;
