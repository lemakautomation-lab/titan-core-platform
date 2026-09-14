CREATE TYPE "PaymentStatus" AS ENUM (
    'PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'REFUNDED'
);

ALTER TABLE "User"
ADD CONSTRAINT "User_id_tenantId_key"
UNIQUE ("id", "tenantId");

ALTER TABLE "Product"
ADD CONSTRAINT "Product_id_tenantId_key"
UNIQUE ("id", "tenantId");

ALTER TABLE "ProductPrice"
ADD CONSTRAINT "ProductPrice_id_productId_key"
UNIQUE ("id", "productId");

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productPriceId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerReference" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Payment_amountMinor_positive_check"
        CHECK ("amountMinor" > 0),
    CONSTRAINT "Payment_currency_format_check"
        CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "Payment_confirmation_state_check"
        CHECK (
            ("status" = 'CONFIRMED'
                AND "providerReference" IS NOT NULL
                AND "confirmedAt" IS NOT NULL)
            OR
            ("status" = 'REFUNDED'
                AND "providerReference" IS NOT NULL
                AND "confirmedAt" IS NOT NULL)
            OR
            ("status" IN ('PENDING', 'FAILED', 'CANCELLED')
                AND "providerReference" IS NULL
                AND "confirmedAt" IS NULL)
        )
);

CREATE UNIQUE INDEX "Payment_tenantId_providerReference_key"
ON "Payment"("tenantId", "providerReference");

CREATE INDEX "Payment_tenantId_userId_idx"
ON "Payment"("tenantId", "userId");

CREATE INDEX "Payment_tenantId_userId_productId_status_idx"
ON "Payment"("tenantId", "userId", "productId", "status");

CREATE INDEX "Payment_productId_idx" ON "Payment"("productId");
CREATE INDEX "Payment_productPriceId_idx" ON "Payment"("productPriceId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_userId_tenantId_fkey"
FOREIGN KEY ("userId", "tenantId")
REFERENCES "User"("id", "tenantId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_productId_tenantId_fkey"
FOREIGN KEY ("productId", "tenantId")
REFERENCES "Product"("id", "tenantId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_productPriceId_productId_fkey"
FOREIGN KEY ("productPriceId", "productId")
REFERENCES "ProductPrice"("id", "productId")
ON DELETE RESTRICT ON UPDATE CASCADE;