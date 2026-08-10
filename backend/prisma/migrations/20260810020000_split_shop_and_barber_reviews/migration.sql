ALTER TABLE "Review"
ADD COLUMN "shopRating" INTEGER,
ADD COLUMN "shopComment" TEXT,
ADD COLUMN "barberRating" INTEGER,
ADD COLUMN "barberComment" TEXT;

-- Existing ratings described the overall appointment. Preserve them as both
-- shop and barber ratings so current public averages remain unchanged.
UPDATE "Review"
SET
  "shopRating" = "rating",
  "shopComment" = "comment",
  "barberRating" = "rating",
  "barberComment" = "comment";

ALTER TABLE "Review"
ALTER COLUMN "shopRating" SET NOT NULL,
ALTER COLUMN "barberRating" SET NOT NULL;

ALTER TABLE "Review"
ADD CONSTRAINT "Review_shopRating_range" CHECK ("shopRating" BETWEEN 1 AND 5),
ADD CONSTRAINT "Review_barberRating_range" CHECK ("barberRating" BETWEEN 1 AND 5);

ALTER TABLE "Review"
DROP COLUMN "rating",
DROP COLUMN "comment";
