ALTER TABLE "OrganisationOnboardingApplication"
  ADD COLUMN "provisionedTenantId" TEXT,
  ADD COLUMN "provisionedOrganisationId" TEXT,
  ADD COLUMN "provisionedAdministratorId" TEXT,
  ADD COLUMN "provisionedPaymentAttemptId" TEXT,
  ADD COLUMN "provisionedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "OrganisationOnboardingApplication_provisionedTenantId_key"
  ON "OrganisationOnboardingApplication"("provisionedTenantId");
CREATE UNIQUE INDEX "OrganisationOnboardingApplication_provisionedOrganisationId_key"
  ON "OrganisationOnboardingApplication"("provisionedOrganisationId");
CREATE UNIQUE INDEX "OrganisationOnboardingApplication_provisionedAdministratorId_key"
  ON "OrganisationOnboardingApplication"("provisionedAdministratorId");
CREATE UNIQUE INDEX "OrganisationOnboardingApplication_provisionedPaymentAttemptId_key"
  ON "OrganisationOnboardingApplication"("provisionedPaymentAttemptId");
