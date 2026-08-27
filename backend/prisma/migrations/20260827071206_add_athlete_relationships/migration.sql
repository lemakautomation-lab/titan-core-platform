-- CreateEnum
CREATE TYPE "AthleteRelationshipType" AS ENUM ('TRAINER', 'COACH', 'TEAM', 'ACADEMY', 'CLUB', 'PERFORMANCE_PROFESSIONAL', 'ORGANISATION');

-- CreateTable
CREATE TABLE "AthleteRelationship" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "relationshipType" "AthleteRelationshipType" NOT NULL,
    "relatedEntityId" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AthleteRelationship_tenantId_idx" ON "AthleteRelationship"("tenantId");

-- CreateIndex
CREATE INDEX "AthleteRelationship_athleteId_idx" ON "AthleteRelationship"("athleteId");

-- CreateIndex
CREATE INDEX "AthleteRelationship_athleteId_relationshipType_idx" ON "AthleteRelationship"("athleteId", "relationshipType");

-- CreateIndex
CREATE INDEX "AthleteRelationship_relatedEntityId_idx" ON "AthleteRelationship"("relatedEntityId");

-- AddForeignKey
ALTER TABLE "AthleteRelationship" ADD CONSTRAINT "AthleteRelationship_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteRelationship" ADD CONSTRAINT "AthleteRelationship_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
