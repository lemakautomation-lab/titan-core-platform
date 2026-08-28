-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "dataType" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceMetric_tenantId_idx" ON "PerformanceMetric"("tenantId");

-- CreateIndex
CREATE INDEX "PerformanceMetric_athleteId_idx" ON "PerformanceMetric"("athleteId");

-- CreateIndex
CREATE INDEX "PerformanceMetric_sportId_idx" ON "PerformanceMetric"("sportId");

-- CreateIndex
CREATE INDEX "PerformanceMetric_tenantId_athleteId_idx" ON "PerformanceMetric"("tenantId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceMetric_tenantId_athleteId_sportId_slug_key" ON "PerformanceMetric"("tenantId", "athleteId", "sportId", "slug");

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
