ALTER TABLE "Shop" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

ALTER TABLE "Barber"
ADD COLUMN "profileImageUrl" TEXT,
ADD COLUMN "specialties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "BarberService" (
    "id" UUID NOT NULL,
    "barberId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "durationOverrideMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarberService_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BarberService_barberId_serviceId_key"
ON "BarberService"("barberId", "serviceId");

CREATE INDEX "BarberService_serviceId_idx" ON "BarberService"("serviceId");

ALTER TABLE "BarberService"
ADD CONSTRAINT "BarberService_barberId_fkey"
FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BarberService"
ADD CONSTRAINT "BarberService_serviceId_fkey"
FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
