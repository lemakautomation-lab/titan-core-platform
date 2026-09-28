CREATE TABLE "AthleteBaselineVersion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "lookbackDays" INTEGER NOT NULL,
    "minimumSamples" INTEGER NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "value" DECIMAL(20,6),
    "earliestRecordedAt" TIMESTAMP(3),
    "latestRecordedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AthleteBaselineVersion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AthleteBaselineVersion_policy_check" CHECK (
        "version" > 0
        AND "method" = 'ARITHMETIC_MEAN'
        AND "lookbackDays" BETWEEN 1 AND 3650
        AND "minimumSamples" BETWEEN 2 AND 10000
        AND "sampleCount" BETWEEN 0 AND 10000
        AND (
            ("status" = 'READY'
             AND "sampleCount" >= "minimumSamples"
             AND "value" IS NOT NULL
             AND "earliestRecordedAt" IS NOT NULL
             AND "latestRecordedAt" IS NOT NULL
             AND "earliestRecordedAt" <= "latestRecordedAt"
             AND "latestRecordedAt" <= "asOf")
            OR
            ("status" = 'INSUFFICIENT_DATA'
             AND "sampleCount" < "minimumSamples"
             AND "value" IS NULL
             AND "earliestRecordedAt" IS NULL
             AND "latestRecordedAt" IS NULL)
        )
    )
);

CREATE UNIQUE INDEX "AthleteBaselineVersion_tenantId_athleteId_metricId_version_key"
    ON "AthleteBaselineVersion"("tenantId", "athleteId", "metricId", "version");
CREATE INDEX "AthleteBaselineVersion_tenantId_athleteId_metricId_createdAt_idx"
    ON "AthleteBaselineVersion"("tenantId", "athleteId", "metricId", "createdAt");

ALTER TABLE "AthleteBaselineVersion"
    ADD CONSTRAINT "AthleteBaselineVersion_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AthleteBaselineVersion"
    ADD CONSTRAINT "AthleteBaselineVersion_athleteId_tenantId_fkey"
    FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AthleteBaselineVersion"
    ADD CONSTRAINT "AthleteBaselineVersion_metricId_tenantId_athleteId_fkey"
    FOREIGN KEY ("metricId", "tenantId", "athleteId")
    REFERENCES "PerformanceMetric"("id", "tenantId", "athleteId")
    ON DELETE RESTRICT ON UPDATE CASCADE;
