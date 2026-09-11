-- CreateTable
CREATE TABLE "SleepTracking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "value" DECIMAL(20,6) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceObservationId" TEXT NOT NULL,

    CONSTRAINT "SleepTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SleepTracking_tenantId_idx" ON "SleepTracking"("tenantId");

-- CreateIndex
CREATE INDEX "SleepTracking_tenantId_athleteId_idx" ON "SleepTracking"("tenantId", "athleteId");

-- CreateIndex
CREATE INDEX "SleepTracking_tenantId_athleteId_recordedAt_idx" ON "SleepTracking"("tenantId", "athleteId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SleepTracking_id_tenantId_athleteId_key" ON "SleepTracking"("id", "tenantId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "SleepTracking_source_identity_key" ON "SleepTracking"("tenantId", "sourceType", "sourceId", "sourceObservationId");

-- AddForeignKey
ALTER TABLE "SleepTracking" ADD CONSTRAINT "SleepTracking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepTracking" ADD CONSTRAINT "SleepTracking_athleteId_tenantId_fkey" FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
