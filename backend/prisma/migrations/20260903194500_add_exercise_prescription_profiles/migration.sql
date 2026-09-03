CREATE TABLE "ExercisePrescriptionProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "goalClassification" TEXT NOT NULL,
    "trainingExperience" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "prescriptionMode" TEXT NOT NULL,
    "defaultSets" INTEGER NOT NULL,
    "defaultRepetitions" INTEGER,
    "defaultDurationSeconds" INTEGER,
    "defaultRestSeconds" INTEGER NOT NULL,
    "estimatedSetDurationSeconds" INTEGER,
    "status" "RecordStatus" NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExercisePrescriptionProfile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ExercisePrescriptionProfile_goalClassification_check" CHECK (
        "goalClassification" IN (
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
    ),
    CONSTRAINT "ExercisePrescriptionProfile_trainingExperience_check" CHECK (
        "trainingExperience" IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')
    ),
    CONSTRAINT "ExercisePrescriptionProfile_prescriptionMode_check" CHECK (
        "prescriptionMode" IN ('REPETITIONS', 'DURATION')
    ),
    CONSTRAINT "ExercisePrescriptionProfile_version_check" CHECK ("version" >= 1),
    CONSTRAINT "ExercisePrescriptionProfile_defaultSets_check" CHECK ("defaultSets" >= 1),
    CONSTRAINT "ExercisePrescriptionProfile_defaultRestSeconds_check" CHECK ("defaultRestSeconds" >= 0),
    CONSTRAINT "ExercisePrescriptionProfile_modeValues_check" CHECK (
        (
            "prescriptionMode" = 'REPETITIONS'
            AND "defaultRepetitions" IS NOT NULL
            AND "defaultRepetitions" > 0
            AND "defaultDurationSeconds" IS NULL
            AND "estimatedSetDurationSeconds" IS NOT NULL
            AND "estimatedSetDurationSeconds" > 0
        )
        OR
        (
            "prescriptionMode" = 'DURATION'
            AND "defaultDurationSeconds" IS NOT NULL
            AND "defaultDurationSeconds" > 0
            AND "defaultRepetitions" IS NULL
            AND "estimatedSetDurationSeconds" IS NULL
        )
    )
);

CREATE UNIQUE INDEX "ExercisePrescriptionProfile_id_tenantId_key"
ON "ExercisePrescriptionProfile"("id", "tenantId");

CREATE UNIQUE INDEX "ExercisePrescriptionProfile_historical_version_key"
ON "ExercisePrescriptionProfile"(
    "tenantId",
    "exerciseId",
    "goalClassification",
    "trainingExperience",
    "version"
);

CREATE UNIQUE INDEX "ExercisePrescriptionProfile_one_active_key"
ON "ExercisePrescriptionProfile"(
    "tenantId",
    "exerciseId",
    "goalClassification",
    "trainingExperience"
)
WHERE "status" = 'ACTIVE';

CREATE INDEX "ExercisePrescriptionProfile_active_lookup_idx"
ON "ExercisePrescriptionProfile"(
    "tenantId",
    "exerciseId",
    "goalClassification",
    "trainingExperience",
    "status"
);

CREATE INDEX "ExercisePrescriptionProfile_tenantId_idx"
ON "ExercisePrescriptionProfile"("tenantId");

ALTER TABLE "ExercisePrescriptionProfile"
ADD CONSTRAINT "ExercisePrescriptionProfile_exerciseId_tenantId_fkey"
FOREIGN KEY ("exerciseId", "tenantId")
REFERENCES "Exercise"("id", "tenantId")
ON DELETE RESTRICT ON UPDATE CASCADE;
