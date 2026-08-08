-- Store a neighbourhood/locality separately from the city so public search can
-- distinguish places such as Miyapur from Hyderabad itself.
ALTER TABLE "Shop" ADD COLUMN "locality" TEXT;

CREATE INDEX "Shop_locality_idx" ON "Shop"("locality");
