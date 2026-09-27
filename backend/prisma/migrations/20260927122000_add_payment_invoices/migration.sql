CREATE TYPE "InvoiceDeliveryStatus" AS ENUM (
    'PENDING',
    'SENDING',
    'SENT',
    'FAILED'
);

CREATE TABLE "BillingInvoiceCounter" (
    "tenantId" TEXT NOT NULL,
    "issueYear" INTEGER NOT NULL,
    "nextSequence" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInvoiceCounter_pkey"
        PRIMARY KEY ("tenantId", "issueYear")
);

CREATE TABLE "BillingInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productPriceId" TEXT NOT NULL,

    "invoiceNumber" TEXT NOT NULL,
    "issueYear" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,

    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "accountsCopyEmail" TEXT NOT NULL,

    "issuerName" TEXT NOT NULL,
    "issuerRegistrationNumber" TEXT,
    "issuerAddressText" TEXT,

    "productName" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "paymentProviderReference" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "pdfContent" BYTEA NOT NULL,
    "pdfSha256" TEXT NOT NULL,

    "deliveryStatus" "InvoiceDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "deliveryProvider" TEXT,
    "deliveryProviderMessageId" TEXT,
    "deliveryLastAttemptAt" TIMESTAMP(3),
    "deliverySentAt" TIMESTAMP(3),
    "deliveryLastError" TEXT,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInvoice_pkey"
        PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingInvoice_tenantId_paymentId_key"
    ON "BillingInvoice"("tenantId", "paymentId");

CREATE UNIQUE INDEX "BillingInvoice_payment_ownership_key"
    ON "BillingInvoice"("paymentId", "tenantId", "userId", "productId");

CREATE UNIQUE INDEX "BillingInvoice_tenantId_invoiceNumber_key"
    ON "BillingInvoice"("tenantId", "invoiceNumber");

CREATE UNIQUE INDEX "BillingInvoice_tenantId_issueYear_sequence_key"
    ON "BillingInvoice"("tenantId", "issueYear", "sequence");

CREATE INDEX "BillingInvoice_tenantId_userId_idx"
    ON "BillingInvoice"("tenantId", "userId");

CREATE INDEX "BillingInvoice_tenantId_deliveryStatus_idx"
    ON "BillingInvoice"("tenantId", "deliveryStatus");

ALTER TABLE "BillingInvoiceCounter"
    ADD CONSTRAINT "BillingInvoiceCounter_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE "BillingInvoice"
    ADD CONSTRAINT "BillingInvoice_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE "BillingInvoice"
    ADD CONSTRAINT "BillingInvoice_userId_tenantId_fkey"
    FOREIGN KEY ("userId", "tenantId")
    REFERENCES "User"("id", "tenantId")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE "BillingInvoice"
    ADD CONSTRAINT "BillingInvoice_payment_ownership_fkey"
    FOREIGN KEY ("paymentId", "tenantId", "userId", "productId")
    REFERENCES "Payment"("id", "tenantId", "userId", "productId")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;