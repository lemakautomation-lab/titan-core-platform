CREATE TABLE "AthleteGoal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteGoal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AthleteGoal_classification_check" CHECK (
        "classification" IN (
            'STRENGTH',
            'HYPERTROPHY',
            'ENDURANCE',
            'SPEED',
            'POWER',
            'MOBILITY',
            'CONDITIONING',
            'GENERAL_FITNESS',
            'SPORT_PERFORMANCE'
        )
    )
);

CREATE UNIQUE INDEX "AthleteGoal_tenantId_athleteId_classification_key"
ON "AthleteGoal"("tenantId", "athleteId", "classification");

CREATE UNIQUE INDEX "AthleteGoal_one_primary_key"
ON "AthleteGoal"("tenantId", "athleteId")
WHERE "isPrimary" = TRUE;

CREATE INDEX "AthleteGoal_tenantId_idx"
ON "AthleteGoal"("tenantId");

CREATE INDEX "AthleteGoal_athleteId_idx"
ON "AthleteGoal"("athleteId");

CREATE INDEX "AthleteGoal_tenantId_athleteId_idx"
ON "AthleteGoal"("tenantId", "athleteId");

ALTER TABLE "AthleteGoal"
ADD CONSTRAINT "AthleteGoal_athleteId_tenantId_fkey"
FOREIGN KEY ("athleteId", "tenantId")
REFERENCES "Athlete"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;
