BEGIN;

ALTER TABLE "PerformanceMeasurement"
ADD COLUMN "sourceType" TEXT,
ADD COLUMN "sourceId" TEXT,
ADD COLUMN "sourceObservationId" TEXT,
ADD COLUMN "correctsMeasurementId" TEXT;

ALTER TABLE "PerformanceMeasurement"
ADD CONSTRAINT "PerformanceMeasurement_id_tenantId_athleteId_metricId_key"
UNIQUE ("id", "tenantId", "athleteId", "metricId");

ALTER TABLE "PerformanceMeasurement"
ADD CONSTRAINT "PerformanceMeasurement_source_identity_key"
UNIQUE ("tenantId", "sourceType", "sourceId", "sourceObservationId");

ALTER TABLE "PerformanceMeasurement"
ADD CONSTRAINT "PerformanceMeasurement_correctsMeasurementId_key"
UNIQUE ("correctsMeasurementId");

ALTER TABLE "PerformanceMeasurement"
ADD CONSTRAINT "PerformanceMeasurement_source_completeness_check"
CHECK (
    ("sourceType" IS NULL AND "sourceId" IS NULL AND "sourceObservationId" IS NULL)
    OR
    ("sourceType" IS NOT NULL AND "sourceId" IS NOT NULL AND "sourceObservationId" IS NOT NULL)
);

ALTER TABLE "PerformanceMeasurement"
ADD CONSTRAINT "PerformanceMeasurement_no_self_correction_check"
CHECK ("correctsMeasurementId" IS NULL OR "correctsMeasurementId" <> "id");

ALTER TABLE "PerformanceMeasurement"
ADD CONSTRAINT "PerformanceMeasurement_correction_scope_fkey"
FOREIGN KEY ("correctsMeasurementId", "tenantId", "athleteId", "metricId")
REFERENCES "PerformanceMeasurement"("id", "tenantId", "athleteId", "metricId")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "PerformanceMeasurement_effective_lookup_idx"
ON "PerformanceMeasurement"("tenantId", "athleteId", "metricId", "correctsMeasurementId");

COMMIT;
