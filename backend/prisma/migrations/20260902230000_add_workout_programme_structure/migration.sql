DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "WorkoutProgramme" AS programme
        LEFT JOIN "Athlete" AS athlete
          ON athlete."id" = programme."athleteId"
         AND athlete."tenantId" = programme."tenantId"
        WHERE athlete."id" IS NULL
    ) THEN
        RAISE EXCEPTION 'WorkoutProgramme tenant/Athlete ownership preflight failed';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "WorkoutProgramme" AS programme
        LEFT JOIN "Sport" AS sport
          ON sport."id" = programme."sportId"
         AND sport."tenantId" = programme."tenantId"
        WHERE programme."sportId" IS NOT NULL
          AND sport."id" IS NULL
    ) THEN
        RAISE EXCEPTION 'WorkoutProgramme tenant/Sport ownership preflight failed';
    END IF;
END $$;

CREATE UNIQUE INDEX "Exercise_id_tenantId_key"
ON "Exercise"("id", "tenantId");

CREATE UNIQUE INDEX "WorkoutProgramme_id_tenantId_key"
ON "WorkoutProgramme"("id", "tenantId");

ALTER TABLE "WorkoutProgramme"
DROP CONSTRAINT "WorkoutProgramme_athleteId_fkey";

ALTER TABLE "WorkoutProgramme"
DROP CONSTRAINT "WorkoutProgramme_sportId_fkey";

ALTER TABLE "WorkoutProgramme"
ADD CONSTRAINT "WorkoutProgramme_athleteId_tenantId_fkey"
FOREIGN KEY ("athleteId", "tenantId")
REFERENCES "Athlete"("id", "tenantId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkoutProgramme"
ADD CONSTRAINT "WorkoutProgramme_sportId_tenantId_fkey"
FOREIGN KEY ("sportId", "tenantId")
REFERENCES "Sport"("id", "tenantId")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "WorkoutProgrammeSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutProgrammeSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkoutProgrammeSession_ordinal_check" CHECK ("ordinal" >= 1),
    CONSTRAINT "WorkoutProgrammeSession_name_check" CHECK (length(btrim("name")) > 0)
);

CREATE TABLE "WorkoutProgrammeExercisePrescription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "repetitions" INTEGER,
    "durationSeconds" INTEGER,
    "restSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutProgrammeExercisePrescription_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkoutProgrammeExercisePrescription_ordinal_check" CHECK ("ordinal" >= 1),
    CONSTRAINT "WorkoutProgrammeExercisePrescription_sets_check" CHECK ("sets" >= 1),
    CONSTRAINT "WorkoutProgrammeExercisePrescription_restSeconds_check" CHECK ("restSeconds" IS NULL OR "restSeconds" >= 0),
    CONSTRAINT "WorkoutProgrammeExercisePrescription_mode_check" CHECK (
        (
            "repetitions" IS NOT NULL
            AND "repetitions" > 0
            AND "durationSeconds" IS NULL
        )
        OR
        (
            "durationSeconds" IS NOT NULL
            AND "durationSeconds" > 0
            AND "repetitions" IS NULL
        )
    )
);

CREATE UNIQUE INDEX "WorkoutProgrammeSession_id_tenantId_key"
ON "WorkoutProgrammeSession"("id", "tenantId");

CREATE UNIQUE INDEX "WorkoutProgrammeSession_programmeId_ordinal_key"
ON "WorkoutProgrammeSession"("programmeId", "ordinal");

CREATE INDEX "WorkoutProgrammeSession_tenantId_programmeId_idx"
ON "WorkoutProgrammeSession"("tenantId", "programmeId");

CREATE UNIQUE INDEX "WorkoutProgrammeExercisePrescription_sessionId_ordinal_key"
ON "WorkoutProgrammeExercisePrescription"("sessionId", "ordinal");

CREATE INDEX "WorkoutProgrammeExercisePrescription_tenantId_sessionId_idx"
ON "WorkoutProgrammeExercisePrescription"("tenantId", "sessionId");

CREATE INDEX "WorkoutProgrammeExercisePrescription_tenantId_exerciseId_idx"
ON "WorkoutProgrammeExercisePrescription"("tenantId", "exerciseId");

ALTER TABLE "WorkoutProgrammeSession"
ADD CONSTRAINT "WorkoutProgrammeSession_programmeId_tenantId_fkey"
FOREIGN KEY ("programmeId", "tenantId")
REFERENCES "WorkoutProgramme"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutProgrammeExercisePrescription"
ADD CONSTRAINT "WorkoutProgrammeExercisePrescription_sessionId_tenantId_fkey"
FOREIGN KEY ("sessionId", "tenantId")
REFERENCES "WorkoutProgrammeSession"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutProgrammeExercisePrescription"
ADD CONSTRAINT "WorkoutProgrammeExercisePrescription_exerciseId_tenantId_fkey"
FOREIGN KEY ("exerciseId", "tenantId")
REFERENCES "Exercise"("id", "tenantId")
ON DELETE RESTRICT ON UPDATE CASCADE;
