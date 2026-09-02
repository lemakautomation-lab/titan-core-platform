BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "PerformanceMetric" AS metric
        INNER JOIN "Athlete" AS athlete
            ON athlete."id" = metric."athleteId"
        WHERE metric."tenantId" <> athlete."tenantId"
    ) THEN
        RAISE EXCEPTION 'R3 integrity precondition failed: PerformanceMetric tenant does not match Athlete tenant.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "PerformanceMetric" AS metric
        INNER JOIN "Sport" AS sport
            ON sport."id" = metric."sportId"
        WHERE metric."tenantId" <> sport."tenantId"
    ) THEN
        RAISE EXCEPTION 'R3 integrity precondition failed: PerformanceMetric tenant does not match Sport tenant.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "PerformanceMeasurement" AS measurement
        INNER JOIN "Athlete" AS athlete
            ON athlete."id" = measurement."athleteId"
        WHERE measurement."tenantId" <> athlete."tenantId"
    ) THEN
        RAISE EXCEPTION 'R3 integrity precondition failed: PerformanceMeasurement tenant does not match Athlete tenant.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "PerformanceMeasurement" AS measurement
        INNER JOIN "PerformanceMetric" AS metric
            ON metric."id" = measurement."metricId"
        WHERE measurement."tenantId" <> metric."tenantId"
    ) THEN
        RAISE EXCEPTION 'R3 integrity precondition failed: PerformanceMeasurement tenant does not match PerformanceMetric tenant.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "PerformanceMeasurement" AS measurement
        INNER JOIN "PerformanceMetric" AS metric
            ON metric."id" = measurement."metricId"
        WHERE measurement."athleteId" <> metric."athleteId"
    ) THEN
        RAISE EXCEPTION 'R3 integrity precondition failed: PerformanceMeasurement Athlete does not match PerformanceMetric Athlete.';
    END IF;
END $$;

ALTER TABLE "Athlete"
ADD CONSTRAINT "Athlete_id_tenantId_key"
UNIQUE ("id", "tenantId");

ALTER TABLE "Sport"
ADD CONSTRAINT "Sport_id_tenantId_key"
UNIQUE ("id", "tenantId");

ALTER TABLE "PerformanceMetric"
ADD CONSTRAINT "PerformanceMetric_id_tenantId_athleteId_key"
UNIQUE ("id", "tenantId", "athleteId");

ALTER TABLE "PerformanceMetric"
ADD CONSTRAINT "PerformanceMetric_athleteId_tenantId_fkey"
FOREIGN KEY ("athleteId", "tenantId")
REFERENCES "Athlete"("id", "tenantId")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "PerformanceMetric"
ADD CONSTRAINT "PerformanceMetric_sportId_tenantId_fkey"
FOREIGN KEY ("sportId", "tenantId")
REFERENCES "Sport"("id", "tenantId")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "PerformanceMeasurement"
ADD CONSTRAINT "PerformanceMeasurement_athleteId_tenantId_fkey"
FOREIGN KEY ("athleteId", "tenantId")
REFERENCES "Athlete"("id", "tenantId")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "PerformanceMeasurement"
ADD CONSTRAINT "PerformanceMeasurement_metricId_tenantId_athleteId_fkey"
FOREIGN KEY ("metricId", "tenantId", "athleteId")
REFERENCES "PerformanceMetric"("id", "tenantId", "athleteId")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "PerformanceMetric"
DROP CONSTRAINT "PerformanceMetric_athleteId_fkey";

ALTER TABLE "PerformanceMetric"
DROP CONSTRAINT "PerformanceMetric_sportId_fkey";

ALTER TABLE "PerformanceMeasurement"
DROP CONSTRAINT "PerformanceMeasurement_athleteId_fkey";

ALTER TABLE "PerformanceMeasurement"
DROP CONSTRAINT "PerformanceMeasurement_metricId_fkey";

COMMIT;
