-- CreateEnum
CREATE TYPE "TrainerSessionScheduleStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TrainerSessionSchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trainerUserId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "TrainerSessionScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerSessionSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainerSessionSchedule_tenantId_trainerUserId_startsAt_idx" ON "TrainerSessionSchedule"("tenantId", "trainerUserId", "startsAt");

-- CreateIndex
CREATE INDEX "TrainerSessionSchedule_tenantId_athleteId_startsAt_idx" ON "TrainerSessionSchedule"("tenantId", "athleteId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerSessionSchedule_id_tenantId_key" ON "TrainerSessionSchedule"("id", "tenantId");


-- AddForeignKey
ALTER TABLE "TrainerSessionSchedule" ADD CONSTRAINT "TrainerSessionSchedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerSessionSchedule" ADD CONSTRAINT "TrainerSessionSchedule_trainerUserId_tenantId_fkey" FOREIGN KEY ("trainerUserId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerSessionSchedule" ADD CONSTRAINT "TrainerSessionSchedule_athleteId_tenantId_fkey" FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
