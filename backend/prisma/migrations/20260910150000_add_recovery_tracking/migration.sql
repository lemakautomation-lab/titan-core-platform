-- CreateTable
CREATE TABLE "RecoveryTracking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "value" DECIMAL(20,6) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceObservationId" TEXT NOT NULL,

    CONSTRAINT "RecoveryTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecoveryTracking_tenantId_idx" ON "RecoveryTracking"("tenantId");

-- CreateIndex
CREATE INDEX "RecoveryTracking_tenantId_athleteId_idx" ON "RecoveryTracking"("tenantId", "athleteId");

-- CreateIndex
CREATE INDEX "RecoveryTracking_tenantId_athleteId_recordedAt_idx" ON "RecoveryTracking"("tenantId", "athleteId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryTracking_id_tenantId_athleteId_key" ON "RecoveryTracking"("id", "tenantId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryTracking_source_identity_key" ON "RecoveryTracking"("tenantId", "sourceType", "sourceId", "sourceObservationId");

-- AddForeignKey
ALTER TABLE "RecoveryTracking" ADD CONSTRAINT "RecoveryTracking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryTracking" ADD CONSTRAINT "RecoveryTracking_athleteId_tenantId_fkey" FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
