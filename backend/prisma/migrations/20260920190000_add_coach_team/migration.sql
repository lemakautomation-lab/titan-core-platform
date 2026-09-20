-- CreateTable
CREATE TABLE "CoachTeam" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "coachUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachTeam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachTeam_tenantId_coachUserId_idx" ON "CoachTeam"("tenantId", "coachUserId");

-- CreateIndex
CREATE INDEX "CoachTeam_tenantId_coachUserId_status_idx" ON "CoachTeam"("tenantId", "coachUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CoachTeam_id_tenantId_key" ON "CoachTeam"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "CoachTeam" ADD CONSTRAINT "CoachTeam_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachTeam" ADD CONSTRAINT "CoachTeam_coachUserId_tenantId_fkey" FOREIGN KEY ("coachUserId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

