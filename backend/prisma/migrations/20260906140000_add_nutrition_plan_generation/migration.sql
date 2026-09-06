-- CreateTable
CREATE TABLE "NutritionPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "requestFingerprintVersion" TEXT NOT NULL,
    "generatorId" TEXT NOT NULL,
    "generatorVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "planSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NutritionPlan_tenantId_athleteId_idx"
ON "NutritionPlan"("tenantId", "athleteId");

-- CreateIndex
CREATE INDEX "NutritionPlan_tenantId_createdAt_idx"
ON "NutritionPlan"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionPlan_id_tenantId_key"
ON "NutritionPlan"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionPlan_tenantId_idempotencyKey_key"
ON "NutritionPlan"("tenantId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "NutritionPlan"
ADD CONSTRAINT "NutritionPlan_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionPlan"
ADD CONSTRAINT "NutritionPlan_athleteId_tenantId_fkey"
FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId")
ON DELETE RESTRICT ON UPDATE CASCADE;
