CREATE TYPE "OrganisationOnboardingPaymentAttemptStatus" AS ENUM (
    'PENDING',
    'SESSION_CREATED',
    'CONFIRMED',
    'FAILED',
    'CANCELLED',
    'EXPIRED'
);

CREATE TABLE "OrganisationOnboardingPaymentAttempt" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "status" "OrganisationOnboardingPaymentAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "providerSessionReference" TEXT,
    "providerTransactionReference" TEXT,
    "sessionExpiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationOnboardingPaymentAttempt_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "OrganisationOnboardingPaymentAttempt_valid_price"
        CHECK (
            "amountMinor" > 0
            AND "currency" ~ '^[A-Z]{3}$'
            AND "billingInterval" IN ('MONTHLY', 'ANNUALLY')
        )
);

CREATE UNIQUE INDEX
    "OrganisationOnboardingPaymentAttempt_requestId_key"
    ON "OrganisationOnboardingPaymentAttempt"("requestId");

CREATE UNIQUE INDEX
    "OrganisationOnboardingPaymentAttempt_provider_providerSessionReference_key"
    ON "OrganisationOnboardingPaymentAttempt"(
        "provider",
        "providerSessionReference"
    );

CREATE UNIQUE INDEX
    "OrganisationOnboardingPaymentAttempt_provider_providerTransactionReference_key"
    ON "OrganisationOnboardingPaymentAttempt"(
        "provider",
        "providerTransactionReference"
    );

CREATE INDEX
    "OrganisationOnboardingPaymentAttempt_applicationId_status_idx"
    ON "OrganisationOnboardingPaymentAttempt"(
        "applicationId",
        "status"
    );

CREATE INDEX
    "OrganisationOnboardingPaymentAttempt_status_createdAt_idx"
    ON "OrganisationOnboardingPaymentAttempt"(
        "status",
        "createdAt"
    );

ALTER TABLE "OrganisationOnboardingPaymentAttempt"
    ADD CONSTRAINT
    "OrganisationOnboardingPaymentAttempt_applicationId_fkey"
    FOREIGN KEY ("applicationId")
    REFERENCES "OrganisationOnboardingApplication"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
