-- CreateTable
CREATE TABLE "RestTracking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "value" DECIMAL(20,6) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceObservationId" TEXT NOT NULL,

    CONSTRAINT "RestTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestTracking_tenantId_idx" ON "RestTracking"("tenantId");

-- CreateIndex
CREATE INDEX "RestTracking_tenantId_athleteId_idx" ON "RestTracking"("tenantId", "athleteId");

-- CreateIndex
CREATE INDEX "RestTracking_tenantId_athleteId_recordedAt_idx" ON "RestTracking"("tenantId", "athleteId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RestTracking_id_tenantId_athleteId_key" ON "RestTracking"("id", "tenantId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "RestTracking_source_identity_key" ON "RestTracking"("tenantId", "sourceType", "sourceId", "sourceObservationId");

-- AddForeignKey
ALTER TABLE "RestTracking" ADD CONSTRAINT "RestTracking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestTracking" ADD CONSTRAINT "RestTracking_athleteId_tenantId_fkey" FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;