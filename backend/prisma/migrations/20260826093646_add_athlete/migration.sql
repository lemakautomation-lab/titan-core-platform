-- CreateTable
CREATE TABLE "Athlete" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Athlete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Athlete_tenantId_idx" ON "Athlete"("tenantId");

-- CreateIndex
CREATE INDEX "Athlete_organisationId_idx" ON "Athlete"("organisationId");

-- CreateIndex
CREATE INDEX "Athlete_userId_idx" ON "Athlete"("userId");

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
