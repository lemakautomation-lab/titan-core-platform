CREATE TABLE "TrainerProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "professionalTitle" TEXT,
    "bio" TEXT,
    "qualifications" TEXT,
    "specialisations" TEXT,
    "yearsExperience" INTEGER,
    "countryCode" TEXT,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrainerProfile_userId_tenantId_key"
ON "TrainerProfile"("userId", "tenantId");

CREATE UNIQUE INDEX "TrainerProfile_id_tenantId_key"
ON "TrainerProfile"("id", "tenantId");

CREATE INDEX "TrainerProfile_tenantId_idx"
ON "TrainerProfile"("tenantId");

ALTER TABLE "TrainerProfile"
ADD CONSTRAINT "TrainerProfile_tenantId_fkey"
FOREIGN KEY ("tenantId")
REFERENCES "Tenant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "TrainerProfile"
ADD CONSTRAINT "TrainerProfile_userId_tenantId_fkey"
FOREIGN KEY ("userId", "tenantId")
REFERENCES "User"("id", "tenantId")
ON DELETE CASCADE
ON UPDATE CASCADE;
