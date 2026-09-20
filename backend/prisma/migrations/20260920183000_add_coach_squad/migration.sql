-- CreateTable
CREATE TABLE "CoachSquad" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "coachUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachSquad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachSquad_tenantId_coachUserId_idx" ON "CoachSquad"("tenantId", "coachUserId");

-- CreateIndex
CREATE INDEX "CoachSquad_tenantId_coachUserId_status_idx" ON "CoachSquad"("tenantId", "coachUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CoachSquad_id_tenantId_key" ON "CoachSquad"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "CoachSquad" ADD CONSTRAINT "CoachSquad_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSquad" ADD CONSTRAINT "CoachSquad_coachUserId_tenantId_fkey" FOREIGN KEY ("coachUserId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

