-- CreateTable
CREATE TABLE "TrainingStress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "value" DECIMAL(20,6) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceObservationId" TEXT NOT NULL,

    CONSTRAINT "TrainingStress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingStress_tenantId_idx" ON "TrainingStress"("tenantId");

-- CreateIndex
CREATE INDEX "TrainingStress_tenantId_athleteId_idx" ON "TrainingStress"("tenantId", "athleteId");

-- CreateIndex
CREATE INDEX "TrainingStress_tenantId_athleteId_recordedAt_idx" ON "TrainingStress"("tenantId", "athleteId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingStress_id_tenantId_athleteId_key" ON "TrainingStress"("id", "tenantId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingStress_source_identity_key" ON "TrainingStress"("tenantId", "sourceType", "sourceId", "sourceObservationId");

-- AddForeignKey
ALTER TABLE "TrainingStress" ADD CONSTRAINT "TrainingStress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingStress" ADD CONSTRAINT "TrainingStress_athleteId_tenantId_fkey" FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
