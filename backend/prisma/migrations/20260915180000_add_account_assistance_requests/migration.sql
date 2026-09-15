CREATE TYPE "AccountAssistanceStatus"
AS ENUM ('OPEN', 'CLOSED', 'EXPIRED');

CREATE TABLE "AccountAssistanceRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "referenceHash" TEXT NOT NULL,
    "status" "AccountAssistanceStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountAssistanceRequest_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "AccountAssistanceRequest_referenceHash_format_check"
        CHECK ("referenceHash" ~ '^[0-9a-f]{64}$'),

    CONSTRAINT "AccountAssistanceRequest_expiry_check"
        CHECK ("expiresAt" > "createdAt"),

    CONSTRAINT "AccountAssistanceRequest_closedAt_check"
        CHECK (
            "closedAt" IS NULL OR
            "closedAt" >= "createdAt"
        )
);

CREATE UNIQUE INDEX
    "AccountAssistanceRequest_referenceHash_key"
ON "AccountAssistanceRequest"("referenceHash");

CREATE INDEX
    "AccountAssistanceRequest_tenantId_status_idx"
ON "AccountAssistanceRequest"("tenantId", "status");

CREATE INDEX
    "AccountAssistanceRequest_expiresAt_idx"
ON "AccountAssistanceRequest"("expiresAt");

CREATE INDEX
    "AccountAssistanceRequest_createdAt_idx"
ON "AccountAssistanceRequest"("createdAt");

ALTER TABLE "AccountAssistanceRequest"
ADD CONSTRAINT "AccountAssistanceRequest_tenantId_fkey"
FOREIGN KEY ("tenantId")
REFERENCES "Tenant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
