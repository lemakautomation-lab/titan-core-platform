-- CreateTable
CREATE TABLE "AthleteDigitalTwin" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteDigitalTwin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AthleteDigitalTwin_tenantId_idx" ON "AthleteDigitalTwin"("tenantId");

-- CreateIndex
CREATE INDEX "AthleteDigitalTwin_athleteId_idx" ON "AthleteDigitalTwin"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteDigitalTwin_tenantId_athleteId_key" ON "AthleteDigitalTwin"("tenantId", "athleteId");

-- AddForeignKey
ALTER TABLE "AthleteDigitalTwin" ADD CONSTRAINT "AthleteDigitalTwin_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteDigitalTwin" ADD CONSTRAINT "AthleteDigitalTwin_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
