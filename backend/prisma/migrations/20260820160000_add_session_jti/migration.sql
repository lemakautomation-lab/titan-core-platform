-- Add JTI as nullable so existing sessions can be backfilled safely.
ALTER TABLE "Session"
ADD COLUMN "jti" TEXT;

-- Every existing session receives its own cryptographically random UUID JTI.
UPDATE "Session"
SET "jti" = gen_random_uuid()::text
WHERE "jti" IS NULL;

-- JTI is mandatory for all sessions.
ALTER TABLE "Session"
ALTER COLUMN "jti" SET NOT NULL;

-- JTI must be globally unique.
CREATE UNIQUE INDEX "Session_jti_key"
ON "Session"("jti");