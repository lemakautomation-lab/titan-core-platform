ALTER TABLE "AthleteBodyMeasurement"
ADD COLUMN "bodyFatMethod" TEXT,
ADD COLUMN "bodyFatSource" TEXT;

ALTER TABLE "AthleteBodyMeasurement"
ADD CONSTRAINT "AthleteBodyMeasurement_body_fat_method_check"
CHECK ("bodyFatMethod" IS NULL OR "bodyFatMethod" IN
    ('BIOELECTRICAL_IMPEDANCE', 'DEXA', 'SKINFOLD_CALIPER', 'CLINICAL_ASSESSMENT'));

ALTER TABLE "AthleteBodyMeasurement"
ADD CONSTRAINT "AthleteBodyMeasurement_body_fat_source_check"
CHECK ("bodyFatSource" IS NULL OR "bodyFatSource" = 'ATHLETE_MANUAL');

-- Earlier body-fat values retain NULL provenance; do not invent their method.
ALTER TABLE "AthleteBodyMeasurement"
ADD CONSTRAINT "AthleteBodyMeasurement_body_fat_provenance_check"
CHECK (("bodyFatMethod" IS NULL AND "bodyFatSource" IS NULL) OR
       ("bodyFatPercentage" IS NOT NULL AND "bodyFatMethod" IS NOT NULL
        AND "bodyFatSource" IS NOT NULL));
