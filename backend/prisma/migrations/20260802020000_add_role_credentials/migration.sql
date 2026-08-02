-- Store one password hash per user role. Existing roles initially keep the
-- account's current password and can be changed independently afterward.
CREATE TABLE "RoleCredential" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "UserRole" NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RoleCredential_pkey" PRIMARY KEY ("id")
);

INSERT INTO "RoleCredential" (
  "id",
  "userId",
  "role",
  "passwordHash",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  "user"."id",
  "expanded"."assignedRole",
  "user"."passwordHash",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User" AS "user"
CROSS JOIN LATERAL unnest("user"."roles") AS "expanded"("assignedRole");

CREATE UNIQUE INDEX "RoleCredential_userId_role_key"
ON "RoleCredential"("userId", "role");

CREATE INDEX "RoleCredential_userId_idx"
ON "RoleCredential"("userId");

ALTER TABLE "RoleCredential"
ADD CONSTRAINT "RoleCredential_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" DROP COLUMN "passwordHash";
