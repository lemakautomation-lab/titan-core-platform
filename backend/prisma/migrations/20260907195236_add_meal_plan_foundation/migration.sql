-- CreateEnum
CREATE TYPE "MealPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- DropIndex
DROP INDEX "Product_slug_key";

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "MealPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "planSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealPlan_tenantId_athleteId_idx" ON "MealPlan"("tenantId", "athleteId");

-- CreateIndex
CREATE INDEX "MealPlan_tenantId_status_idx" ON "MealPlan"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_id_tenantId_key" ON "MealPlan"("id", "tenantId");

-- RenameForeignKey
ALTER TABLE "PerformanceMeasurement" RENAME CONSTRAINT "PerformanceMeasurement_correction_scope_fkey" TO "PerformanceMeasurement_correctsMeasurementId_tenantId_athl_fkey";

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_athleteId_tenantId_fkey" FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "PerformanceMeasurement_tenantId_athleteId_metricId_recordedAt_i" RENAME TO "PerformanceMeasurement_tenantId_athleteId_metricId_recorded_idx";
