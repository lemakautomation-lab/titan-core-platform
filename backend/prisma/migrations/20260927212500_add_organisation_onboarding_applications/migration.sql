CREATE TYPE "OrganisationOnboardingStatus" AS ENUM (
    'PENDING_VERIFICATION', 'PENDING_PAYMENT', 'PROVISIONED', 'CANCELLED', 'EXPIRED'
);

CREATE TABLE "OrganisationOnboardingPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganisationOnboardingPlan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrganisationOnboardingPlan_valid_price" CHECK (
        "amountMinor" > 0 AND "currency" ~ '^[A-Z]{3}$'
        AND "billingInterval" IN ('MONTHLY', 'ANNUALLY')
    )
);

CREATE UNIQUE INDEX "OrganisationOnboardingPlan_code_key"
    ON "OrganisationOnboardingPlan"("code");

CREATE TABLE "OrganisationOnboardingApplication" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "organisationName" TEXT NOT NULL,
    "organisationSlug" TEXT NOT NULL,
    "administratorEmail" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "status" "OrganisationOnboardingStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganisationOnboardingApplication_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrganisationOnboardingApplication_valid_price" CHECK (
        "amountMinor" > 0 AND "currency" ~ '^[A-Z]{3}$'
        AND "billingInterval" IN ('MONTHLY', 'ANNUALLY')
    )
);

CREATE UNIQUE INDEX "OrganisationOnboardingApplication_requestId_key"
    ON "OrganisationOnboardingApplication"("requestId");
CREATE INDEX "OrganisationOnboardingApplication_administratorEmail_status_idx"
    ON "OrganisationOnboardingApplication"("administratorEmail", "status");
CREATE INDEX "OrganisationOnboardingApplication_expiresAt_status_idx"
    ON "OrganisationOnboardingApplication"("expiresAt", "status");
ALTER TABLE "OrganisationOnboardingApplication"
    ADD CONSTRAINT "OrganisationOnboardingApplication_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "OrganisationOnboardingPlan"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
