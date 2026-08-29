-- CreateTable
CREATE TABLE "WorkoutProgramme" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "trainingFrequency" INTEGER NOT NULL,
    "sessionDurationMinutes" INTEGER NOT NULL,
    "sportId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutProgramme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutProgramme_tenantId_idx" ON "WorkoutProgramme"("tenantId");

-- CreateIndex
CREATE INDEX "WorkoutProgramme_athleteId_idx" ON "WorkoutProgramme"("athleteId");

-- CreateIndex
CREATE INDEX "WorkoutProgramme_sportId_idx" ON "WorkoutProgramme"("sportId");

-- CreateIndex
CREATE INDEX "WorkoutProgramme_tenantId_athleteId_idx" ON "WorkoutProgramme"("tenantId", "athleteId");

-- AddForeignKey
ALTER TABLE "WorkoutProgramme" ADD CONSTRAINT "WorkoutProgramme_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutProgramme" ADD CONSTRAINT "WorkoutProgramme_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutProgramme" ADD CONSTRAINT "WorkoutProgramme_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
