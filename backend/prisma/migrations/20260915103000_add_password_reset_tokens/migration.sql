CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "PasswordResetToken_token_hash_format_check"
        CHECK ("tokenHash" ~ '^[0-9a-f]{64}$'),

    CONSTRAINT "PasswordResetToken_expiry_check"
        CHECK ("expiresAt" > "createdAt")
);

CREATE UNIQUE INDEX
    "PasswordResetToken_tokenHash_key"
ON "PasswordResetToken"("tokenHash");

CREATE INDEX
    "PasswordResetToken_tenantId_userId_idx"
ON "PasswordResetToken"("tenantId", "userId");

CREATE INDEX
    "PasswordResetToken_expiresAt_idx"
ON "PasswordResetToken"("expiresAt");

ALTER TABLE "PasswordResetToken"
ADD CONSTRAINT "PasswordResetToken_tenantId_fkey"
FOREIGN KEY ("tenantId")
REFERENCES "Tenant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "PasswordResetToken"
ADD CONSTRAINT "PasswordResetToken_userId_tenantId_fkey"
FOREIGN KEY ("userId", "tenantId")
REFERENCES "User"("id", "tenantId")
ON DELETE CASCADE
ON UPDATE CASCADE;
