ALTER TABLE "CoachSquadAthlete"
DROP CONSTRAINT "CoachSquadAthlete_athleteId_fkey";

ALTER TABLE "CoachSquadAthlete"
ADD CONSTRAINT "CoachSquadAthlete_athleteId_tenantId_fkey"
FOREIGN KEY ("athleteId", "tenantId")
REFERENCES "Athlete"("id", "tenantId")
ON DELETE CASCADE
ON UPDATE CASCADE;