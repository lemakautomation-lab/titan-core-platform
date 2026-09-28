CREATE TABLE "OrganisationOnboardingEmailVerificationToken" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganisationOnboardingEmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganisationOnboardingEmailVerificationToken_tokenHash_key"
  ON "OrganisationOnboardingEmailVerificationToken"("tokenHash");
CREATE INDEX "OrganisationOnboardingEmailVerificationToken_applicationId_consumedAt_revokedAt_idx"
  ON "OrganisationOnboardingEmailVerificationToken"("applicationId", "consumedAt", "revokedAt");
ALTER TABLE "OrganisationOnboardingEmailVerificationToken"
  ADD CONSTRAINT "OrganisationOnboardingEmailVerificationToken_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "OrganisationOnboardingApplication"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
