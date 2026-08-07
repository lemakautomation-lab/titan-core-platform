-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('AUTHENTICATION_SUCCESS', 'AUTHENTICATION_FAILURE', 'AUTHORIZATION_FAILURE', 'INVALID_AUTH_HEADER', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED');

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "eventType" "SecurityEventType" NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_idx" ON "SecurityEvent"("eventType");

-- CreateIndex
CREATE INDEX "SecurityEvent_tenantId_idx" ON "SecurityEvent"("tenantId");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE INDEX "SecurityEvent_ipAddress_idx" ON "SecurityEvent"("ipAddress");

-- CreateIndex
CREATE INDEX "SecurityEvent_requestId_idx" ON "SecurityEvent"("requestId");

-- CreateIndex
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_createdAt_idx" ON "SecurityEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_tenantId_createdAt_idx" ON "SecurityEvent"("tenantId", "createdAt");
