CREATE TYPE "BillingSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED');

CREATE TABLE "BillingSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "status" "BillingSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BillingSubscription_recurring_interval_check"
        CHECK ("billingInterval" IN ('MONTHLY', 'ANNUALLY'))
);

CREATE UNIQUE INDEX "BillingSubscription_ownership_key"
    ON "BillingSubscription"("id", "tenantId", "userId", "productId");
CREATE INDEX "BillingSubscription_tenantId_userId_productId_status_idx"
    ON "BillingSubscription"("tenantId", "userId", "productId", "status");

ALTER TABLE "BillingSubscription"
    ADD CONSTRAINT "BillingSubscription_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingSubscription"
    ADD CONSTRAINT "BillingSubscription_userId_tenantId_fkey"
    FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingSubscription"
    ADD CONSTRAINT "BillingSubscription_productId_tenantId_fkey"
    FOREIGN KEY ("productId", "tenantId") REFERENCES "Product"("id", "tenantId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "BillingSubscriptionPeriod" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingSubscriptionPeriod_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BillingSubscriptionPeriod_date_order_check"
        CHECK ("periodEnd" > "periodStart")
);

CREATE UNIQUE INDEX "BillingSubscriptionPeriod_paymentId_key"
    ON "BillingSubscriptionPeriod"("paymentId");
CREATE UNIQUE INDEX "BillingSubscriptionPeriod_payment_ownership_key"
    ON "BillingSubscriptionPeriod"("paymentId", "tenantId", "userId", "productId");
CREATE UNIQUE INDEX "BillingSubscriptionPeriod_start_key"
    ON "BillingSubscriptionPeriod"("subscriptionId", "periodStart");
CREATE INDEX "BillingSubscriptionPeriod_tenantId_userId_periodEnd_idx"
    ON "BillingSubscriptionPeriod"("tenantId", "userId", "periodEnd");

ALTER TABLE "BillingSubscriptionPeriod"
    ADD CONSTRAINT "BillingSubscriptionPeriod_subscription_ownership_fkey"
    FOREIGN KEY ("subscriptionId", "tenantId", "userId", "productId")
    REFERENCES "BillingSubscription"("id", "tenantId", "userId", "productId")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingSubscriptionPeriod"
    ADD CONSTRAINT "BillingSubscriptionPeriod_payment_ownership_fkey"
    FOREIGN KEY ("paymentId", "tenantId", "userId", "productId")
    REFERENCES "Payment"("id", "tenantId", "userId", "productId")
    ON DELETE RESTRICT ON UPDATE CASCADE;
