-- CreateTable
CREATE TABLE "PerformanceMeasurement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "value" DECIMAL(20,6) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceMeasurement_tenantId_athleteId_metricId_recordedAt_idx"
ON "PerformanceMeasurement"("tenantId", "athleteId", "metricId", "recordedAt");

-- CreateIndex
CREATE INDEX "PerformanceMeasurement_tenantId_athleteId_idx"
ON "PerformanceMeasurement"("tenantId", "athleteId");

-- AddForeignKey
ALTER TABLE "PerformanceMeasurement"
ADD CONSTRAINT "PerformanceMeasurement_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMeasurement"
ADD CONSTRAINT "PerformanceMeasurement_athleteId_fkey"
FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMeasurement"
ADD CONSTRAINT "PerformanceMeasurement_metricId_fkey"
FOREIGN KEY ("metricId") REFERENCES "PerformanceMetric"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
