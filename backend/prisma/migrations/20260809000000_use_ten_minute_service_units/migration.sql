UPDATE "Service" SET "durationMin" = 10;

UPDATE "BarberService"
SET "durationOverrideMin" = 10
WHERE "durationOverrideMin" IS NOT NULL;
