CREATE TABLE "AthleteBodyMeasurement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "heightCm" DECIMAL(6,2) NOT NULL,
    "weightKg" DECIMAL(7,3) NOT NULL,
    "bmi" DECIMAL(6,2) NOT NULL,
    "bodyFatPercentage" DECIMAL(5,2),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AthleteBodyMeasurement_pkey"
    PRIMARY KEY ("id"),

    CONSTRAINT "AthleteBodyMeasurement_height_check"
    CHECK ("heightCm" > 0 AND "heightCm" <= 300),

    CONSTRAINT "AthleteBodyMeasurement_weight_check"
    CHECK ("weightKg" > 0 AND "weightKg" <= 1000),

    CONSTRAINT "AthleteBodyMeasurement_bmi_check"
    CHECK ("bmi" > 0 AND "bmi" <= 500),

    CONSTRAINT "AthleteBodyMeasurement_body_fat_check"
    CHECK (
        "bodyFatPercentage" IS NULL OR
        (
            "bodyFatPercentage" >= 0 AND
            "bodyFatPercentage" <= 100
        )
    )
);

CREATE UNIQUE INDEX
"AthleteBodyMeasurement_id_tenantId_athleteId_key"
ON "AthleteBodyMeasurement"(
    "id",
    "tenantId",
    "athleteId"
);

CREATE INDEX
"AthleteBodyMeasurement_tenantId_idx"
ON "AthleteBodyMeasurement"("tenantId");

CREATE INDEX
"AthleteBodyMeasurement_athleteId_idx"
ON "AthleteBodyMeasurement"("athleteId");

CREATE INDEX
"AthleteBodyMeasurement_timeline_idx"
ON "AthleteBodyMeasurement"(
    "tenantId",
    "athleteId",
    "recordedAt"
);

ALTER TABLE "AthleteBodyMeasurement"
ADD CONSTRAINT
"AthleteBodyMeasurement_athleteId_tenantId_fkey"
FOREIGN KEY ("athleteId", "tenantId")
REFERENCES "Athlete"("id", "tenantId")
ON DELETE CASCADE
ON UPDATE CASCADE;