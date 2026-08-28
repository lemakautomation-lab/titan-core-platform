-- CreateTable
CREATE TABLE "Sport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sport_tenantId_idx" ON "Sport"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_tenantId_slug_key" ON "Sport"("tenantId", "slug");

-- AddForeignKey
ALTER TABLE "Sport" ADD CONSTRAINT "Sport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
