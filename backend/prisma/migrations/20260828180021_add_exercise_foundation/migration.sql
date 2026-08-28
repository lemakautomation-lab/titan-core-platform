-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "movement" TEXT NOT NULL,
    "muscleGroups" TEXT[],
    "equipment" TEXT[],
    "trainingObjective" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "trainingPhase" TEXT,
    "sportId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exercise_tenantId_idx" ON "Exercise"("tenantId");

-- CreateIndex
CREATE INDEX "Exercise_sportId_idx" ON "Exercise"("sportId");

-- CreateIndex
CREATE INDEX "Exercise_tenantId_sportId_idx" ON "Exercise"("tenantId", "sportId");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_tenantId_slug_key" ON "Exercise"("tenantId", "slug");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
