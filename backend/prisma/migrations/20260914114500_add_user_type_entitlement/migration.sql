ALTER TABLE "Product"
ADD COLUMN "entitlementUserType" "OnboardingUserType";

CREATE TYPE "EntitlementStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'REVOKED'
);

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_id_tenantId_userId_productId_key"
UNIQUE ("id", "tenantId", "userId", "productId");

CREATE TABLE "UserTypeEntitlement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userType" "OnboardingUserType" NOT NULL,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTypeEntitlement_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "UserTypeEntitlement_validity_check"
        CHECK (
            "validUntil" IS NULL OR
            "validUntil" > "validFrom"
        )
);

CREATE UNIQUE INDEX "UserTypeEntitlement_paymentId_key"
ON "UserTypeEntitlement"("paymentId");

CREATE UNIQUE INDEX "UserTypeEntitlement_payment_ownership_key"
ON "UserTypeEntitlement"(
    "paymentId",
    "tenantId",
    "userId",
    "productId"
);
CREATE UNIQUE INDEX "UserTypeEntitlement_id_tenantId_key"
ON "UserTypeEntitlement"("id", "tenantId");

CREATE INDEX "UserTypeEntitlement_tenantId_userId_idx"
ON "UserTypeEntitlement"("tenantId", "userId");

CREATE INDEX "UserTypeEntitlement_tenantId_userId_userType_status_idx"
ON "UserTypeEntitlement"(
    "tenantId",
    "userId",
    "userType",
    "status"
);

CREATE INDEX "UserTypeEntitlement_tenantId_productId_idx"
ON "UserTypeEntitlement"("tenantId", "productId");

CREATE INDEX "UserTypeEntitlement_status_idx"
ON "UserTypeEntitlement"("status");

CREATE INDEX "UserTypeEntitlement_validUntil_idx"
ON "UserTypeEntitlement"("validUntil");

ALTER TABLE "UserTypeEntitlement"
ADD CONSTRAINT "UserTypeEntitlement_tenantId_fkey"
FOREIGN KEY ("tenantId")
REFERENCES "Tenant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "UserTypeEntitlement"
ADD CONSTRAINT "UserTypeEntitlement_userId_tenantId_fkey"
FOREIGN KEY ("userId", "tenantId")
REFERENCES "User"("id", "tenantId")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "UserTypeEntitlement"
ADD CONSTRAINT "UserTypeEntitlement_productId_tenantId_fkey"
FOREIGN KEY ("productId", "tenantId")
REFERENCES "Product"("id", "tenantId")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "UserTypeEntitlement"
ADD CONSTRAINT "UserTypeEntitlement_payment_ownership_fkey"
FOREIGN KEY (
    "paymentId",
    "tenantId",
    "userId",
    "productId"
)
REFERENCES "Payment"(
    "id",
    "tenantId",
    "userId",
    "productId"
)
ON DELETE RESTRICT
ON UPDATE CASCADE;
