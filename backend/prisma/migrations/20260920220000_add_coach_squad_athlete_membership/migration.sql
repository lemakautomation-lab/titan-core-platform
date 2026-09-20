CREATE TABLE "CoachSquadAthlete" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachSquadAthlete_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoachSquadAthlete_tenantId_squadId_athleteId_key"
ON "CoachSquadAthlete"("tenantId", "squadId", "athleteId");

CREATE INDEX "CoachSquadAthlete_tenantId_squadId_idx"
ON "CoachSquadAthlete"("tenantId", "squadId");

CREATE INDEX "CoachSquadAthlete_tenantId_athleteId_idx"
ON "CoachSquadAthlete"("tenantId", "athleteId");

ALTER TABLE "CoachSquadAthlete"
ADD CONSTRAINT "CoachSquadAthlete_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CoachSquadAthlete"
ADD CONSTRAINT "CoachSquadAthlete_squadId_tenantId_fkey"
FOREIGN KEY ("squadId", "tenantId")
REFERENCES "CoachSquad"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CoachSquadAthlete"
ADD CONSTRAINT "CoachSquadAthlete_athleteId_fkey"
FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
