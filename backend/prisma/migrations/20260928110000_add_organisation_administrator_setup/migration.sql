CREATE TABLE "OrganisationAdministratorSetupToken" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganisationAdministratorSetupToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrganisationAdministratorSetupToken_tokenHash_key"
  ON "OrganisationAdministratorSetupToken"("tokenHash");
CREATE INDEX "OrganisationAdministratorSetupToken_applicationId_consumedAt_revokedAt_idx"
  ON "OrganisationAdministratorSetupToken"("applicationId", "consumedAt", "revokedAt");
ALTER TABLE "OrganisationAdministratorSetupToken"
  ADD CONSTRAINT "OrganisationAdministratorSetupToken_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "OrganisationOnboardingApplication"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
